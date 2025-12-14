"""
Agent Session Logic
===================

Core agent interaction functions for running autonomous coding sessions.
Simplified recovery system with robust error handling.
"""

import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from claude_code_sdk import ClaudeSDKClient

from client import create_client
from progress import print_session_header, print_progress_summary
from prompts import get_initializer_prompt, get_coding_prompt, copy_spec_to_project

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
AUTO_CONTINUE_DELAY_SECONDS = 3
MAX_RETRIES_ON_ERROR = 2
RETRY_DELAY_SECONDS = 5


# ============================================================================
# SESSION STATE TRACKING (Simplified)
# ============================================================================

def mark_session_started(project_dir: Path, session_num: int) -> None:
    """Mark a session as started (used to detect interruptions)."""
    state_file = project_dir / ".session_state.json"
    state = {
        "status": "started",
        "session": session_num,
        "timestamp": datetime.now().isoformat()
    }
    try:
        with open(state_file, "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        logger.warning(f"Could not write session state: {e}")


def mark_session_completed(project_dir: Path, session_num: int) -> None:
    """Mark a session as completed cleanly."""
    state_file = project_dir / ".session_state.json"
    state = {
        "status": "completed",
        "session": session_num,
        "timestamp": datetime.now().isoformat()
    }
    try:
        with open(state_file, "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        logger.warning(f"Could not write session state: {e}")


def was_previous_session_interrupted(project_dir: Path) -> bool:
    """Check if the previous session was interrupted."""
    state_file = project_dir / ".session_state.json"
    if not state_file.exists():
        return False
    try:
        with open(state_file, "r") as f:
            state = json.load(f)
        return state.get("status") == "started"
    except (json.JSONDecodeError, IOError) as e:
        logger.warning(f"Could not read session state: {e}")
        return False


# ============================================================================
# ERROR DETECTION AND HANDLING
# ============================================================================

def is_retriable_error(error: Exception) -> bool:
    """
    Determine if an error is retriable.

    Some errors indicate transient issues that might succeed on retry.
    Others indicate fundamental problems that won't be fixed by retrying.
    """
    error_str = str(error).lower()

    # Retriable errors (transient issues)
    retriable_patterns = [
        "timeout",
        "connection reset",
        "connection refused",
        "temporary",
        "rate limit",
        "overloaded",
        "503",
        "502",
        "504",
    ]

    for pattern in retriable_patterns:
        if pattern in error_str:
            return True

    # Non-retriable errors (fundamental issues)
    non_retriable_patterns = [
        "authentication",
        "unauthorized",
        "forbidden",
        "invalid api key",
        "invalid_api_key",
        "permission denied",
        "not found",
        "400",
        "401",
        "403",
        "404",
    ]

    for pattern in non_retriable_patterns:
        if pattern in error_str:
            return False

    # Default to retriable for unknown errors
    return True


def classify_error(error: Exception) -> str:
    """
    Classify an error for better handling and logging.

    Returns a classification string for the error type.
    """
    error_str = str(error).lower()
    error_type = type(error).__name__

    if "broken pipe" in error_str or "epipe" in error_str:
        return "subprocess_crash"
    elif "stream closed" in error_str:
        return "stream_closed"
    elif "timeout" in error_str:
        return "timeout"
    elif "connection" in error_str:
        return "connection_error"
    elif "authentication" in error_str or "api key" in error_str:
        return "auth_error"
    elif error_type == "BrokenPipeError":
        return "subprocess_crash"
    else:
        return "unknown"


# ============================================================================
# MAIN AGENT SESSION
# ============================================================================

async def run_agent_session(
    client: ClaudeSDKClient,
    message: str,
    project_dir: Path,
) -> tuple[str, str]:
    """
    Run a single agent session using Claude Agent SDK.

    Args:
        client: Claude SDK client
        message: The prompt to send
        project_dir: Project directory path

    Returns:
        (status, response_text) where status is:
        - "continue" if agent should continue working
        - "error" if an error occurred
        - "fatal" if a non-retriable error occurred
    """
    print("Sending prompt to Claude Agent SDK...\n")
    logger.info("Starting agent session")

    try:
        # Send the query
        await client.query(message)

        # Collect response text and show tool use
        response_text = ""
        async for msg in client.receive_response():
            msg_type = type(msg).__name__

            # Handle AssistantMessage (text and tool use)
            if msg_type == "AssistantMessage" and hasattr(msg, "content"):
                for block in msg.content:
                    block_type = type(block).__name__

                    if block_type == "TextBlock" and hasattr(block, "text"):
                        response_text += block.text
                        print(block.text, end="", flush=True)
                    elif block_type == "ToolUseBlock" and hasattr(block, "name"):
                        print(f"\n[Tool: {block.name}]", flush=True)
                        if hasattr(block, "input"):
                            input_str = str(block.input)
                            if len(input_str) > 200:
                                print(f"   Input: {input_str[:200]}...", flush=True)
                            else:
                                print(f"   Input: {input_str}", flush=True)

            # Handle UserMessage (tool results)
            elif msg_type == "UserMessage" and hasattr(msg, "content"):
                for block in msg.content:
                    block_type = type(block).__name__

                    if block_type == "ToolResultBlock":
                        result_content = getattr(block, "content", "")
                        is_error = getattr(block, "is_error", False)

                        # Check if command was blocked by security hook
                        if "blocked" in str(result_content).lower():
                            print(f"   [BLOCKED] {result_content}", flush=True)
                        elif is_error:
                            # Show errors (truncated)
                            error_str = str(result_content)[:500]
                            print(f"   [Error] {error_str}", flush=True)
                        else:
                            # Tool succeeded - just show brief confirmation
                            print("   [Done]", flush=True)

        print("\n" + "-" * 70 + "\n")
        logger.info("Agent session completed successfully")
        return "continue", response_text

    except BrokenPipeError as e:
        logger.error(f"Subprocess crashed (BrokenPipeError): {e}")
        print(f"\n[ERROR] Subprocess connection lost: {e}")
        print("The Claude CLI subprocess may have crashed.")
        return "error", str(e)

    except asyncio.TimeoutError as e:
        logger.error(f"Session timeout: {e}")
        print(f"\n[ERROR] Session timed out: {e}")
        return "error", str(e)

    except ConnectionError as e:
        logger.error(f"Connection error: {e}")
        print(f"\n[ERROR] Connection error: {e}")
        return "error", str(e)

    except Exception as e:
        error_class = classify_error(e)
        logger.error(f"Error during agent session ({error_class}): {e}")
        print(f"\n[ERROR] {type(e).__name__}: {e}")

        if not is_retriable_error(e):
            print("This error is not retriable. Please check configuration.")
            return "fatal", str(e)

        return "error", str(e)


# ============================================================================
# SIMPLIFIED CLEANUP (No separate session)
# ============================================================================

def log_interruption_warning(project_dir: Path) -> None:
    """
    Log a warning about potential interruption without running a cleanup session.

    The next coding session will handle recovery via Step 0 in the prompt.
    """
    print("\n" + "!" * 70)
    print("  WARNING: Previous session may have been interrupted!")
    print("  The coding prompt includes recovery steps (Step 0).")
    print("  Any uncommitted work will be handled automatically.")
    print("!" * 70 + "\n")

    # Update progress file with warning
    progress_file = project_dir / "claude-progress.txt"
    try:
        existing = ""
        if progress_file.exists():
            existing = progress_file.read_text()

        warning = (
            f"\n=== SESSION RECOVERY NOTE ({datetime.now().isoformat()}) ===\n"
            "Previous session was interrupted or ended with error.\n"
            "Check for uncommitted changes with 'git status'.\n"
            "============================================\n\n"
        )

        # Only add if not already present
        if "SESSION RECOVERY NOTE" not in existing:
            progress_file.write_text(warning + existing)
            logger.info("Added recovery note to claude-progress.txt")

    except Exception as e:
        logger.warning(f"Could not update progress file: {e}")


# ============================================================================
# MAIN LOOP
# ============================================================================

async def run_autonomous_agent(
    project_dir: Path,
    model: str,
    max_iterations: Optional[int] = None,
) -> None:
    """
    Run the autonomous agent loop.

    Args:
        project_dir: Directory for the project
        model: Claude model to use
        max_iterations: Maximum number of iterations (None for unlimited)
    """
    print("\n" + "=" * 70)
    print("  AUTONOMOUS CODING AGENT DEMO")
    print("=" * 70)
    print(f"\nProject directory: {project_dir}")
    print(f"Model: {model}")
    if max_iterations:
        print(f"Max iterations: {max_iterations}")
    else:
        print("Max iterations: Unlimited (will run until completion)")
    print()

    logger.info(f"Starting autonomous agent - project: {project_dir}, model: {model}")

    # Create project directory
    project_dir.mkdir(parents=True, exist_ok=True)

    # Check if this is a fresh start or continuation
    tests_file = project_dir / "feature_list.json"
    is_first_run = not tests_file.exists()

    if is_first_run:
        print("Fresh start - will use initializer agent")
        print()
        print("=" * 70)
        print("  NOTE: First session takes 10-20+ minutes!")
        print("  The agent is generating 200 detailed test cases.")
        print("  This may appear to hang - it's working. Watch for [Tool: ...] output.")
        print("=" * 70)
        print()
        # Copy the app spec into the project directory for the agent to read
        copy_spec_to_project(project_dir)
        logger.info("Fresh start - using initializer agent")
    else:
        print("Continuing existing project")
        print_progress_summary(project_dir)
        logger.info("Continuing existing project")

        # Check if previous session was interrupted (simplified handling)
        if was_previous_session_interrupted(project_dir):
            log_interruption_warning(project_dir)

    # Main loop
    iteration = 0
    consecutive_errors = 0

    while True:
        iteration += 1

        # Check max iterations
        if max_iterations and iteration > max_iterations:
            print(f"\nReached max iterations ({max_iterations})")
            print("To continue, run the script again without --max-iterations")
            logger.info(f"Reached max iterations: {max_iterations}")
            break

        # Print session header
        print_session_header(iteration, is_first_run)

        # Mark session as started (for interruption detection)
        mark_session_started(project_dir, iteration)

        # Create client (fresh context)
        try:
            client = create_client(project_dir, model)
        except Exception as e:
            logger.error(f"Failed to create client: {e}")
            print(f"\n[FATAL] Could not create Claude client: {e}")
            print("Please check your authentication and configuration.")
            break

        # Choose prompt based on session type
        if is_first_run:
            prompt = get_initializer_prompt()
            is_first_run = False  # Only use initializer once
        else:
            prompt = get_coding_prompt()

        # Run session with async context manager
        try:
            async with client:
                status, response = await run_agent_session(client, prompt, project_dir)
        except Exception as e:
            logger.error(f"Session context manager error: {e}")
            status = "error"
            response = str(e)

        # Mark session as completed
        mark_session_completed(project_dir, iteration)

        # Handle status
        if status == "continue":
            consecutive_errors = 0
            print(f"\nAgent will auto-continue in {AUTO_CONTINUE_DELAY_SECONDS}s...")
            print_progress_summary(project_dir)
            await asyncio.sleep(AUTO_CONTINUE_DELAY_SECONDS)

        elif status == "error":
            consecutive_errors += 1
            logger.warning(f"Session error (consecutive: {consecutive_errors})")

            if consecutive_errors >= MAX_RETRIES_ON_ERROR:
                print(f"\n[WARNING] {consecutive_errors} consecutive errors.")
                print("Taking a longer break before retrying...")
                await asyncio.sleep(RETRY_DELAY_SECONDS * 2)
                consecutive_errors = 0  # Reset after longer break
            else:
                print(f"\nSession encountered an error (attempt {consecutive_errors}/{MAX_RETRIES_ON_ERROR})")
                print(f"Will retry with a fresh session in {RETRY_DELAY_SECONDS}s...")
                await asyncio.sleep(RETRY_DELAY_SECONDS)

        elif status == "fatal":
            logger.error(f"Fatal error - stopping agent loop")
            print("\n[FATAL] Non-retriable error encountered.")
            print("Please fix the issue and restart the agent.")
            break

        # Small delay between sessions
        if max_iterations is None or iteration < max_iterations:
            print("\nPreparing next session...\n")
            await asyncio.sleep(1)

    # Final summary
    print("\n" + "=" * 70)
    print("  SESSION COMPLETE")
    print("=" * 70)
    print(f"\nProject directory: {project_dir}")
    print_progress_summary(project_dir)

    # Print instructions for running the generated application
    print("\n" + "-" * 70)
    print("  TO RUN THE GENERATED APPLICATION:")
    print("-" * 70)
    print(f"\n  cd {project_dir.resolve()}")
    print("  ./init.sh           # Run the setup script")
    print("  # Or manually:")
    print("  npm install && npm run dev")
    print("\n  Then open http://localhost:3000 (or check init.sh for the URL)")
    print("-" * 70)

    print("\nDone!")
    logger.info("Agent loop completed")
