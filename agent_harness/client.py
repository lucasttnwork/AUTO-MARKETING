"""
Claude SDK Client Configuration
===============================

Functions for creating and configuring the Claude Agent SDK client.
Cross-platform support for Windows and Unix-like systems.
"""

import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv, find_dotenv
from claude_code_sdk import ClaudeCodeOptions, ClaudeSDKClient
from claude_code_sdk.types import HookMatcher

from security import bash_security_hook, path_normalization_hook
from platform_utils import (
    IS_WINDOWS,
    IS_GIT_BASH,
    get_platform_info,
    normalize_path,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('agent_debug.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file (override=True to use .env values)
load_dotenv(find_dotenv(), override=True)


# Puppeteer MCP tools for browser automation
PUPPETEER_TOOLS = [
    "mcp__puppeteer__puppeteer_navigate",
    "mcp__puppeteer__puppeteer_screenshot",
    "mcp__puppeteer__puppeteer_click",
    "mcp__puppeteer__puppeteer_fill",
    "mcp__puppeteer__puppeteer_select",
    "mcp__puppeteer__puppeteer_hover",
    "mcp__puppeteer__puppeteer_evaluate",
]

# Built-in tools
BUILTIN_TOOLS = [
    "Read",
    "Write",
    "Edit",
    "Glob",
    "Grep",
    "Bash",
]


def log_platform_info():
    """Log platform information for debugging."""
    platform_info = get_platform_info()
    logger.info("=" * 60)
    logger.info("Platform Information:")
    logger.info(f"  - System: {platform_info['system']}")
    logger.info(f"  - Is Windows: {platform_info['is_windows']}")
    logger.info(f"  - Is Git Bash: {platform_info['is_git_bash']}")
    logger.info(f"  - Is WSL: {platform_info['is_wsl']}")
    logger.info(f"  - Shell: {platform_info['shell']}")
    logger.info("=" * 60)

    if IS_WINDOWS:
        print("   Platform: Windows")
        if IS_GIT_BASH:
            print("   Shell: Git Bash (Unix commands available)")
        else:
            print("   Shell: Native Windows")
    else:
        print(f"   Platform: {platform_info['system']}")


def create_client(project_dir: Path, model: str) -> ClaudeSDKClient:
    """
    Create a Claude Agent SDK client with multi-layered security.

    Args:
        project_dir: Directory for the project
        model: Claude model to use

    Returns:
        Configured ClaudeSDKClient

    Security layers (defense in depth):
    1. Sandbox - OS-level bash command isolation prevents filesystem escape
    2. Permissions - File operations restricted to project_dir only
    3. Security hooks - Bash commands validated against a denylist
       (see security.py for BLOCKED_COMMANDS - only dangerous commands are blocked)
    4. Path normalization - Cross-platform path handling
    """
    # Log platform info
    log_platform_info()

    # Check for authentication
    # Priority: 1. Regular API key (sk-ant-api*) via env var
    #           2. CLI credentials file (~/.claude/.credentials.json)
    api_key = os.environ.get("ANTHROPIC_API_KEY")

    # Check if it's a regular API key (sk-ant-api*)
    has_regular_api_key = api_key and api_key.startswith("sk-ant-api")

    # If it's an OAuth token in env var, clear it - OAuth tokens expire and
    # the CLI handles refresh via credentials file automatically
    has_oauth_in_env = api_key and api_key.startswith("sk-ant-oat")
    if has_oauth_in_env:
        print("   (Cleared stale OAuth token from ANTHROPIC_API_KEY env var)")
        logger.info("Cleared stale OAuth token from ANTHROPIC_API_KEY env var")
        del os.environ["ANTHROPIC_API_KEY"]
        api_key = None

    # Check for Claude Code CLI credentials file
    credentials_file = Path.home() / ".claude" / ".credentials.json"
    has_cli_credentials = credentials_file.exists()

    if not has_regular_api_key and not has_cli_credentials:
        error_msg = (
            "No authentication found.\n"
            "Options:\n"
            "  1. Set ANTHROPIC_API_KEY=sk-ant-api... in your .env file (regular API key)\n"
            "  2. Run 'claude login' to authenticate with Claude Code CLI (creates ~/.claude/.credentials.json)\n"
            "Get your API key from: https://console.anthropic.com/"
        )
        logger.error(error_msg)
        raise ValueError(error_msg)

    # Log which authentication method is being used
    if has_regular_api_key:
        print("   Authentication: Regular API key (ANTHROPIC_API_KEY)")
        logger.info("Using regular API key authentication")
    elif has_cli_credentials:
        print("   Authentication: CLI credentials (~/.claude/.credentials.json)")
        logger.info("Using Claude Code CLI credentials")

    # Create comprehensive security settings
    # Note: Using relative paths ("./**") restricts access to project directory
    # since cwd is set to project_dir
    security_settings = {
        "sandbox": {"enabled": True, "autoAllowBashIfSandboxed": True},
        "permissions": {
            "defaultMode": "acceptEdits",  # Auto-approve edits within allowed directories
            "allow": [
                # Allow all file operations within the project directory
                "Read(./**)",
                "Write(./**)",
                "Edit(./**)",
                "Glob(./**)",
                "Grep(./**)",
                # Bash permission granted here, but actual commands are validated
                # by the bash_security_hook (see security.py for allowed commands)
                "Bash(*)",
            ],
        },
    }

    # Ensure project directory exists before creating settings file
    project_dir.mkdir(parents=True, exist_ok=True)

    # Write settings to a file in the project directory
    settings_file = project_dir / ".claude_settings.json"
    with open(settings_file, "w") as f:
        json.dump(security_settings, f, indent=2)

    print(f"Created security settings at {settings_file}")
    print("   - Sandbox enabled (OS-level bash isolation)")
    print(f"   - Filesystem restricted to: {project_dir.resolve()}")
    print("   - Bash commands: denylist approach (blocks only dangerous commands)")
    print("   - Blocked commands: system destruction, privilege escalation, etc.")
    if IS_WINDOWS:
        print("   - Windows commands: taskkill, del, rmdir validated separately")
    print()

    logger.info(f"Security settings created at {settings_file}")

    # Pass env vars to subprocess
    # SDK merges these with parent environment
    env_vars = {}
    if has_regular_api_key and api_key:
        env_vars["ANTHROPIC_API_KEY"] = api_key
        print(f"   DEBUG: Passing API key to subprocess (first 20 chars): {api_key[:20]}...")
    else:
        # CLI will use credentials from ~/.claude/.credentials.json
        print("   DEBUG: CLI will use credentials from ~/.claude/.credentials.json")

    # Pass additional credentials from environment (Supabase, OpenRouter, etc.)
    additional_env_vars = [
        "OPENROUTER_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "DEFAULT_AI_PROVIDER",
        "DEFAULT_MODEL_STRING",
    ]

    for var_name in additional_env_vars:
        value = os.environ.get(var_name)
        if value:
            env_vars[var_name] = value
            if "KEY" in var_name or "SECRET" in var_name:
                print(f"   DEBUG: Passing {var_name} to subprocess (first 10 chars): {value[:10]}...")
            else:
                print(f"   DEBUG: Passing {var_name} to subprocess: {value}")

    # System prompt for coding agent with platform awareness
    platform_note = ""
    if IS_WINDOWS:
        platform_note = " You are running on Windows with Git Bash. Use 'taskkill /F /IM node.exe' to kill processes (NOT pkill). Paths should use forward slashes."

    system_prompt = (
        "You are an expert full-stack developer. Focus on writing clean code, "
        "following best practices, and making incremental progress on failing tests."
        f"{platform_note}"
    )

    logger.info(f"System prompt: {system_prompt}")

    # Build hooks configuration
    # Path normalization for file tools + security for bash
    hooks_config = {
        "PreToolUse": [
            # Path normalization for all file-related tools
            HookMatcher(matcher="Read", hooks=[path_normalization_hook]),
            HookMatcher(matcher="Write", hooks=[path_normalization_hook]),
            HookMatcher(matcher="Edit", hooks=[path_normalization_hook]),
            HookMatcher(matcher="Glob", hooks=[path_normalization_hook]),
            HookMatcher(matcher="Grep", hooks=[path_normalization_hook]),
            # Security validation for bash commands
            HookMatcher(matcher="Bash", hooks=[bash_security_hook]),
        ],
    }

    logger.info("Creating Claude SDK client...")
    logger.info(f"  - Model: {model}")
    logger.info(f"  - CWD: {project_dir.resolve()}")
    logger.info(f"  - Max turns: 1000")

    # Note: MCP servers disabled due to 60s timeout in SDK initialization
    # To enable browser automation, uncomment mcp_servers section below
    return ClaudeSDKClient(
        options=ClaudeCodeOptions(
            model=model,
            system_prompt=system_prompt,
            allowed_tools=[
                *BUILTIN_TOOLS,
                *PUPPETEER_TOOLS,
            ],
            mcp_servers={
                "puppeteer": {"command": "npx", "args": ["puppeteer-mcp-server"]}
            },
            hooks=hooks_config,
            max_turns=1000,
            cwd=str(project_dir.resolve()),
            settings=str(settings_file.resolve()),  # Use absolute path
            env=env_vars,  # Pass API key if available, otherwise inherit parent env
        )
    )
