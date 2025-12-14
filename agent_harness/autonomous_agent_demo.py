#!/usr/bin/env python3
"""
Autonomous Coding Agent Demo
============================

A minimal harness demonstrating long-running autonomous coding with Claude.
This script implements the two-agent pattern (initializer + coding agent) and
incorporates all the strategies from the long-running agents guide.

Example Usage:
    python autonomous_agent_demo.py --project-dir ./claude_clone_demo
    python autonomous_agent_demo.py --project-dir ./claude_clone_demo --max-iterations 5
"""

import argparse
import asyncio
import os
from pathlib import Path

# IMPORTANT: Clear stale OAuth tokens BEFORE loading dotenv or importing SDK
# OAuth tokens from env vars expire and cause initialization failures
# The CLI will automatically use fresh tokens from ~/.claude/.credentials.json
_api_key = os.environ.get("ANTHROPIC_API_KEY", "")
if _api_key.startswith("sk-ant-oat"):
    del os.environ["ANTHROPIC_API_KEY"]
    print("(Cleared stale OAuth token from ANTHROPIC_API_KEY env var)")

from dotenv import load_dotenv, find_dotenv

# Load environment variables from .env file (override=True to use .env values)
load_dotenv(find_dotenv(), override=True)

# Clear OAuth again in case .env had one (shouldn't, but safety check)
_api_key = os.environ.get("ANTHROPIC_API_KEY", "")
if _api_key.startswith("sk-ant-oat"):
    del os.environ["ANTHROPIC_API_KEY"]

from agent import run_autonomous_agent


# Configuration
DEFAULT_MODEL = "claude-opus-4-5-20251101"
# Default project directory (absolute path to ensure correct location)
DEFAULT_PROJECT_DIR = Path(r"C:\Users\Lucas\OneDrive\Documentos\PROJETOS - CODE\GOOGLE ANTIGRAVITY PROJECTS\AUTO-Coding\Linear-Coding-Agent-Harness\autonomous-coding\Auto-Marketing-Maker")


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Autonomous Coding Agent Demo - Long-running agent harness",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Use default project directory (Auto-Marketing-Maker)
  python autonomous_agent_demo.py

  # Use a specific project directory
  python autonomous_agent_demo.py --project-dir ./my_project

  # Use a specific model
  python autonomous_agent_demo.py --model claude-sonnet-4-5-20250929

  # Limit iterations for testing
  python autonomous_agent_demo.py --max-iterations 5

Environment Variables:
  ANTHROPIC_API_KEY    Your Anthropic API key or OAuth token (required)
        """,
    )

    parser.add_argument(
        "--project-dir",
        type=Path,
        default=DEFAULT_PROJECT_DIR,
        help=f"Directory for the project (default: {DEFAULT_PROJECT_DIR})",
    )

    parser.add_argument(
        "--max-iterations",
        type=int,
        default=None,
        help="Maximum number of agent iterations (default: unlimited)",
    )

    parser.add_argument(
        "--model",
        type=str,
        default=DEFAULT_MODEL,
        help=f"Claude model to use (default: {DEFAULT_MODEL})",
    )

    return parser.parse_args()


def main() -> None:
    """Main entry point."""
    args = parse_args()

    # Check for authentication
    # Priority: 1. Regular API key via env var
    #           2. CLI credentials file (~/.claude/.credentials.json)
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    has_regular_api_key = api_key and api_key.startswith("sk-ant-api")
    
    # If OAuth token in env var, clear it (OAuth tokens expire)
    has_oauth_in_env = api_key and api_key.startswith("sk-ant-oat")
    if has_oauth_in_env:
        del os.environ["ANTHROPIC_API_KEY"]

    # Check for Claude Code CLI credentials file
    credentials_file = Path.home() / ".claude" / ".credentials.json"
    has_cli_credentials = credentials_file.exists()

    if not has_regular_api_key and not has_cli_credentials:
        print("Error: No authentication found")
        print("\nOptions:")
        print("  1. Set ANTHROPIC_API_KEY=sk-ant-api-... in your .env file")
        print("  2. Run 'claude login' to authenticate with Claude Code CLI")
        print("\nGet your API key from: https://console.anthropic.com/")
        return

    if has_regular_api_key:
        print(f"Authentication: API key detected")
    else:
        print(f"Authentication: CLI credentials detected (~/.claude/.credentials.json)")

    # Use project directory as specified (no automatic generations/ prefix)
    project_dir = args.project_dir

    # Run the agent
    try:
        asyncio.run(
            run_autonomous_agent(
                project_dir=project_dir,
                model=args.model,
                max_iterations=args.max_iterations,
            )
        )
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        print("To resume, run the same command again")
    except Exception as e:
        print(f"\nFatal error: {e}")
        raise


if __name__ == "__main__":
    main()
