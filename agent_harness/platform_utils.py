"""
Platform Utilities
==================

Cross-platform utilities for detecting and handling OS-specific behavior.
Provides consistent interface for Windows and Unix-like systems.
"""

import os
import platform
import logging
from pathlib import Path
from typing import Optional

# Configure logging
logger = logging.getLogger(__name__)

# Platform detection
SYSTEM = platform.system()
IS_WINDOWS = SYSTEM == "Windows"
IS_LINUX = SYSTEM == "Linux"
IS_MACOS = SYSTEM == "Darwin"
IS_UNIX = IS_LINUX or IS_MACOS

# Git Bash detection (Windows only)
IS_GIT_BASH = IS_WINDOWS and ("MSYSTEM" in os.environ or "MINGW" in os.environ.get("MSYSTEM", ""))

# WSL detection
IS_WSL = IS_LINUX and "microsoft" in platform.release().lower()


def get_platform_info() -> dict:
    """
    Get comprehensive platform information.

    Returns:
        Dictionary with platform details
    """
    return {
        "system": SYSTEM,
        "is_windows": IS_WINDOWS,
        "is_linux": IS_LINUX,
        "is_macos": IS_MACOS,
        "is_unix": IS_UNIX,
        "is_git_bash": IS_GIT_BASH,
        "is_wsl": IS_WSL,
        "shell": os.environ.get("SHELL", os.environ.get("COMSPEC", "unknown")),
        "python_version": platform.python_version(),
        "architecture": platform.machine(),
    }


def normalize_path(path_str: str) -> str:
    """
    Normalize file paths to work on current platform.

    Handles:
    - Git Bash style paths: /c/Users/... -> C:/Users/...
    - Windows backslashes: C:\\Users\\... -> C:/Users/...
    - Ensures consistent forward slashes

    Args:
        path_str: Original path string

    Returns:
        Normalized path string for current platform
    """
    if not path_str:
        return path_str

    original = path_str

    if IS_WINDOWS:
        # Handle Git Bash style paths (/c/Users/... or /d/Projects/...)
        if path_str.startswith('/') and len(path_str) > 2:
            # Check if second char is a letter (drive letter)
            if path_str[1].isalpha() and (len(path_str) == 2 or path_str[2] == '/'):
                drive = path_str[1].upper()
                rest = path_str[3:] if len(path_str) > 3 else ""
                path_str = f"{drive}:/{rest}"

        # Normalize backslashes to forward slashes for consistency
        path_str = path_str.replace('\\', '/')

        # Remove double slashes (except for UNC paths)
        while '//' in path_str and not path_str.startswith('//'):
            path_str = path_str.replace('//', '/')

    if path_str != original:
        logger.debug(f"Normalized path: {original} -> {path_str}")

    return path_str


def to_native_path(path_str: str) -> str:
    """
    Convert path to native OS format.

    On Windows: Uses backslashes (C:\\Users\\...)
    On Unix: Uses forward slashes (/home/user/...)

    Args:
        path_str: Path string to convert

    Returns:
        Path in native OS format
    """
    normalized = normalize_path(path_str)

    if IS_WINDOWS:
        return normalized.replace('/', '\\')
    return normalized


def get_process_kill_command(process_name: str, force: bool = True) -> str:
    """
    Get the appropriate command to kill a process by name.

    Args:
        process_name: Name of the process (e.g., "node", "npm")
        force: Whether to force kill (default True)

    Returns:
        Platform-appropriate kill command
    """
    if IS_WINDOWS:
        # Ensure .exe extension for Windows
        if not process_name.endswith('.exe'):
            process_name = f"{process_name}.exe"

        if force:
            return f"taskkill /F /IM {process_name}"
        return f"taskkill /IM {process_name}"
    else:
        # Unix-like systems
        if force:
            return f"pkill -9 -f {process_name}"
        return f"pkill -f {process_name}"


def get_process_list_command() -> str:
    """
    Get the command to list running processes.

    Returns:
        Platform-appropriate process list command
    """
    if IS_WINDOWS:
        return "tasklist"
    return "ps aux"


def get_file_list_command(directory: str = ".") -> str:
    """
    Get the command to list files in a directory.

    Args:
        directory: Directory to list (default current)

    Returns:
        Platform-appropriate ls/dir command
    """
    if IS_WINDOWS and not IS_GIT_BASH:
        return f"dir /B {directory}"
    return f"ls -la {directory}"


def get_file_read_command(filepath: str) -> str:
    """
    Get the command to read a file's contents.

    Args:
        filepath: Path to file

    Returns:
        Platform-appropriate cat/type command
    """
    if IS_WINDOWS and not IS_GIT_BASH:
        return f"type {filepath}"
    return f"cat {filepath}"


def command_exists(command: str) -> bool:
    """
    Check if a command exists on the system.

    Args:
        command: Command name to check

    Returns:
        True if command exists, False otherwise
    """
    import shutil
    return shutil.which(command) is not None


def get_shell_info() -> dict:
    """
    Get information about the current shell environment.

    Returns:
        Dictionary with shell details
    """
    info = {
        "shell": os.environ.get("SHELL", os.environ.get("COMSPEC", "unknown")),
        "term": os.environ.get("TERM", "unknown"),
        "user": os.environ.get("USER", os.environ.get("USERNAME", "unknown")),
        "home": os.environ.get("HOME", os.environ.get("USERPROFILE", "unknown")),
    }

    if IS_WINDOWS:
        info["comspec"] = os.environ.get("COMSPEC", "unknown")
        info["msystem"] = os.environ.get("MSYSTEM", None)

    return info


# Mapping of Unix commands to Windows equivalents
UNIX_TO_WINDOWS_COMMANDS = {
    "ls": "dir",
    "cat": "type",
    "rm": "del",
    "cp": "copy",
    "mv": "move",
    "pwd": "cd",
    "clear": "cls",
    "grep": "findstr",
    "touch": "echo. >",
    "mkdir": "mkdir",  # Same on both
    "rmdir": "rmdir",  # Same on both
    "chmod": None,  # No direct equivalent
    "pkill": "taskkill",
    "kill": "taskkill",
    "ps": "tasklist",
    "which": "where",
    "export": "set",
}

# Mapping of Windows commands to Unix equivalents
WINDOWS_TO_UNIX_COMMANDS = {v: k for k, v in UNIX_TO_WINDOWS_COMMANDS.items() if v}


def get_equivalent_command(command: str) -> Optional[str]:
    """
    Get the equivalent command for the other platform.

    Args:
        command: Command name

    Returns:
        Equivalent command for other platform, or None
    """
    if IS_WINDOWS:
        return UNIX_TO_WINDOWS_COMMANDS.get(command)
    return WINDOWS_TO_UNIX_COMMANDS.get(command)


# Print platform info on import (for debugging)
if __name__ == "__main__":
    import json
    print("Platform Information:")
    print(json.dumps(get_platform_info(), indent=2))
    print("\nShell Information:")
    print(json.dumps(get_shell_info(), indent=2))
