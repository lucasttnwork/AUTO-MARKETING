"""
Security Hooks for Autonomous Coding Agent
==========================================

Pre-tool-use hooks that validate bash commands for security.
Uses a denylist approach - blocks only explicitly dangerous/destructive commands.

Cross-platform support: Windows (taskkill, del) and Unix (pkill, rm).
"""

import os
import re
import shlex
import logging
from typing import Tuple, List, Set

# Import platform utilities
from platform_utils import IS_WINDOWS, IS_GIT_BASH, normalize_path

# Configure logging
logger = logging.getLogger(__name__)

# ============================================================================
# BLOCKED COMMANDS - Highly destructive operations
# ============================================================================

# Base blocked commands (both platforms)
BASE_BLOCKED_COMMANDS: Set[str] = {
    # System destruction
    "dd",  # Can destroy disks
    "mkfs",  # Formats filesystems
    "fdisk",  # Disk partitioning
    "parted",  # Disk partitioning
    # System modification
    "reboot",
    "shutdown",
    "poweroff",
    "halt",
    "init",
    # Package management (can install malware)
    "apt-get",
    "apt",
    "yum",
    "dnf",
    "pacman",
    "zypper",
    # Kernel/system level
    "modprobe",
    "insmod",
    "rmmod",
    "kexec",
    # Network attacks
    "iptables",
    "nmap",
    "hping3",
    "tcpdump",  # Can capture sensitive data
    # Privilege escalation
    "sudo",
    "su",
    "doas",
    # Cron/scheduled tasks (persistence)
    "crontab",
    "at",
    # User management
    "useradd",
    "userdel",
    "usermod",
    "passwd",
    "chown",  # Changing ownership can be dangerous
    "chgrp",
    # Dangerous shell features
    "eval",  # Can execute arbitrary code
    "exec",  # Can replace current process
    # System information that could aid attacks
    "ifconfig",
    "ip",  # Network configuration
    # Disk operations
    "mount",
    "umount",
    "fsck",
}

# Windows-specific blocked commands
WINDOWS_BLOCKED_COMMANDS: Set[str] = {
    "format",  # Windows format command
    "diskpart",  # Disk partitioning
    "bcdedit",  # Boot configuration
    "reg",  # Registry editing
    "schtasks",  # Scheduled tasks
    "net",  # Network/user management (too broad)
    "sc",  # Service control
    "runas",  # Privilege escalation
    "wmic",  # Can be dangerous for system modification
}

# Unix-specific blocked commands
UNIX_BLOCKED_COMMANDS: Set[str] = {
    # rm is validated separately, not blocked outright
}

# Combined blocked commands based on platform
if IS_WINDOWS:
    BLOCKED_COMMANDS = BASE_BLOCKED_COMMANDS | WINDOWS_BLOCKED_COMMANDS
else:
    BLOCKED_COMMANDS = BASE_BLOCKED_COMMANDS | UNIX_BLOCKED_COMMANDS

# ============================================================================
# COMMANDS NEEDING EXTRA VALIDATION
# ============================================================================

# Base commands needing validation (both platforms)
BASE_VALIDATION_COMMANDS: Set[str] = {
    "chmod",  # File permissions
    "rm",  # File deletion (Unix/Git Bash)
}

# Windows-specific commands needing validation
WINDOWS_VALIDATION_COMMANDS: Set[str] = {
    "taskkill",  # Process termination
    "del",  # File deletion
    "rmdir",  # Directory deletion
    "rd",  # Directory deletion (alias)
    "erase",  # File deletion (alias)
}

# Unix-specific commands needing validation
UNIX_VALIDATION_COMMANDS: Set[str] = {
    "pkill",  # Process termination
    "kill",  # Process termination
}

# Combined validation commands based on platform
if IS_WINDOWS:
    COMMANDS_NEEDING_EXTRA_VALIDATION = (
        BASE_VALIDATION_COMMANDS | WINDOWS_VALIDATION_COMMANDS | UNIX_VALIDATION_COMMANDS
    )
else:
    COMMANDS_NEEDING_EXTRA_VALIDATION = BASE_VALIDATION_COMMANDS | UNIX_VALIDATION_COMMANDS

# ============================================================================
# ALLOWED PROCESS NAMES FOR KILLING
# ============================================================================

# Allowed process names for pkill/taskkill (development-related)
ALLOWED_PROCESS_NAMES_UNIX: Set[str] = {
    "node",
    "npm",
    "npx",
    "vite",
    "next",
    "python",
    "python3",
    "tsx",
    "ts-node",
}

ALLOWED_PROCESS_NAMES_WINDOWS: Set[str] = {
    "node.exe",
    "npm.exe",
    "npx.exe",
    "vite.exe",
    "next.exe",
    "python.exe",
    "pythonw.exe",
    "tsx.exe",
}


# ============================================================================
# COMMAND PARSING UTILITIES
# ============================================================================

def split_command_segments(command_string: str) -> List[str]:
    """
    Split a compound command into individual command segments.

    Handles command chaining (&&, ||, ;) but not pipes (those are single commands).

    Args:
        command_string: The full shell command

    Returns:
        List of individual command segments
    """
    # Split on && and || while preserving the ability to handle each segment
    segments = re.split(r"\s*(?:&&|\|\|)\s*", command_string)

    # Further split on semicolons
    result = []
    for segment in segments:
        sub_segments = re.split(r'(?<!["\'])\s*;\s*(?!["\'])', segment)
        for sub in sub_segments:
            sub = sub.strip()
            if sub:
                result.append(sub)

    return result


def extract_commands(command_string: str) -> List[str]:
    """
    Extract command names from a shell command string.

    Handles pipes, command chaining (&&, ||, ;), and subshells.
    Returns the base command names (without paths).

    Args:
        command_string: The full shell command

    Returns:
        List of command names found in the string
    """
    commands = []

    # Split on semicolons that aren't inside quotes (simple heuristic)
    segments = re.split(r'(?<!["\'])\s*;\s*(?!["\'])', command_string)

    for segment in segments:
        segment = segment.strip()
        if not segment:
            continue

        try:
            tokens = shlex.split(segment)
        except ValueError:
            # Malformed command (unclosed quotes, etc.)
            # Return empty to trigger block (fail-safe)
            logger.warning(f"Could not parse command segment: {segment}")
            return []

        if not tokens:
            continue

        # Track when we expect a command vs arguments
        expect_command = True

        for token in tokens:
            # Shell operators indicate a new command follows
            if token in ("|", "||", "&&", "&"):
                expect_command = True
                continue

            # Skip shell keywords that precede commands
            if token in (
                "if", "then", "else", "elif", "fi",
                "for", "while", "until", "do", "done",
                "case", "esac", "in", "!", "{", "}",
            ):
                continue

            # Skip flags/options (both Unix - and Windows /)
            if token.startswith("-") or (IS_WINDOWS and token.startswith("/")):
                continue

            # Skip variable assignments (VAR=value)
            if "=" in token and not token.startswith("="):
                continue

            if expect_command:
                # Extract the base command name (handle paths like /usr/bin/python)
                cmd = os.path.basename(token)
                # On Windows, also handle .exe extension variations
                if IS_WINDOWS:
                    cmd_lower = cmd.lower()
                    # Normalize common variations
                    if cmd_lower.endswith('.exe'):
                        cmd = cmd_lower[:-4]  # Remove .exe for comparison
                    elif cmd_lower.endswith('.cmd') or cmd_lower.endswith('.bat'):
                        cmd = cmd_lower[:-4]
                commands.append(cmd)
                expect_command = False

    return commands


def get_command_for_validation(cmd: str, segments: List[str]) -> str:
    """
    Find the specific command segment that contains the given command.

    Args:
        cmd: The command name to find
        segments: List of command segments

    Returns:
        The segment containing the command, or empty string if not found
    """
    for segment in segments:
        segment_commands = extract_commands(segment)
        if cmd in segment_commands:
            return segment
    return ""


# ============================================================================
# VALIDATION FUNCTIONS - UNIX
# ============================================================================

def validate_pkill_command(command_string: str) -> Tuple[bool, str]:
    """
    Validate pkill commands - only allow killing dev-related processes.

    Returns:
        Tuple of (is_allowed, reason_if_blocked)
    """
    try:
        tokens = shlex.split(command_string)
    except ValueError:
        return False, "Could not parse pkill command"

    if not tokens:
        return False, "Empty pkill command"

    # Separate flags from arguments
    args = []
    for token in tokens[1:]:
        if not token.startswith("-"):
            args.append(token)

    if not args:
        return False, "pkill requires a process name"

    # The target is typically the last non-flag argument
    target = args[-1]

    # For -f flag (full command line match), extract the first word as process name
    if " " in target:
        target = target.split()[0]

    if target in ALLOWED_PROCESS_NAMES_UNIX:
        return True, ""
    return False, f"pkill only allowed for dev processes: {ALLOWED_PROCESS_NAMES_UNIX}"


def validate_kill_command(command_string: str) -> Tuple[bool, str]:
    """
    Validate kill commands - allow killing processes but block dangerous signals.

    Returns:
        Tuple of (is_allowed, reason_if_blocked)
    """
    try:
        tokens = shlex.split(command_string)
    except ValueError:
        return False, "Could not parse kill command"

    if not tokens:
        return False, "Empty kill command"

    pids = []

    for token in tokens[1:]:
        if token.startswith("-"):
            continue
        elif token.isdigit():
            pids.append(int(token))

    # Block killing init/systemd (PID 1)
    if 1 in pids:
        return False, "Cannot kill init process (PID 1)"

    return True, ""


def validate_chmod_command(command_string: str) -> Tuple[bool, str]:
    """
    Validate chmod commands - only allow making files executable with +x.

    Returns:
        Tuple of (is_allowed, reason_if_blocked)
    """
    try:
        tokens = shlex.split(command_string)
    except ValueError:
        return False, "Could not parse chmod command"

    if not tokens or tokens[0] != "chmod":
        return False, "Not a chmod command"

    mode = None
    files = []

    for token in tokens[1:]:
        if token.startswith("-"):
            return False, "chmod flags are not allowed"
        elif mode is None:
            mode = token
        else:
            files.append(token)

    if mode is None:
        return False, "chmod requires a mode"

    if not files:
        return False, "chmod requires at least one file"

    # Only allow +x variants (making files executable)
    if not re.match(r"^[ugoa]*\+x$", mode):
        return False, f"chmod only allowed with +x mode, got: {mode}"

    return True, ""


def validate_rm_command(command_string: str) -> Tuple[bool, str]:
    """
    Validate rm commands - block dangerous patterns like rm -rf /, allow safe file deletions.

    Returns:
        Tuple of (is_allowed, reason_if_blocked)
    """
    try:
        tokens = shlex.split(command_string)
    except ValueError:
        return False, "Could not parse rm command"

    if not tokens or tokens[0] != "rm":
        return False, "Not an rm command"

    has_recursive = False
    has_force = False
    targets = []

    for token in tokens[1:]:
        if token.startswith("-"):
            if "r" in token or "R" in token:
                has_recursive = True
            if "f" in token:
                has_force = True
        else:
            targets.append(token)

    if not targets:
        return False, "rm command requires target files/directories"

    # Block dangerous recursive operations on critical paths
    dangerous_paths = {
        "/", "/*", "~", "~/*", "/usr", "/etc", "/bin", "/sbin", "/var", "/home",
        "C:\\", "C:\\*", "C:/", "C:/*",
    }

    if has_recursive:
        for target in targets:
            normalized_target = target.strip().rstrip("/\\")
            if normalized_target in dangerous_paths:
                return False, f"Recursive rm on critical system path is blocked: {target}"
            # Block absolute paths starting with / or drive letters
            if target.startswith("/") and not target.startswith("./"):
                return False, f"Recursive rm on absolute path is blocked: {target}"

    # Block rm -rf with wildcards
    if has_recursive and has_force and "*" in " ".join(targets):
        return False, "rm -rf with wildcards is too dangerous"

    return True, ""


# ============================================================================
# VALIDATION FUNCTIONS - WINDOWS
# ============================================================================

def validate_taskkill_command(command_string: str) -> Tuple[bool, str]:
    """
    Validate taskkill commands (Windows) - only allow killing dev-related processes.

    Syntax: taskkill /F /IM process.exe
            taskkill /PID 1234

    Returns:
        Tuple of (is_allowed, reason_if_blocked)
    """
    try:
        # Handle Windows-style arguments (/ instead of -)
        # shlex doesn't handle // well, so we normalize first
        normalized = command_string.replace("//", "/")
        tokens = shlex.split(normalized)
    except ValueError:
        return False, "Could not parse taskkill command"

    if not tokens:
        return False, "Empty taskkill command"

    # Parse Windows-style flags
    has_im = False
    has_pid = False
    target_process = None
    target_pid = None

    i = 0
    while i < len(tokens):
        token = tokens[i].upper()

        if token in ("/IM", "/im", "-IM", "-im"):
            has_im = True
            if i + 1 < len(tokens):
                target_process = tokens[i + 1]
                i += 1
        elif token in ("/PID", "/pid", "-PID", "-pid"):
            has_pid = True
            if i + 1 < len(tokens):
                target_pid = tokens[i + 1]
                i += 1
        elif token.startswith("/IM:") or token.startswith("-IM:"):
            has_im = True
            target_process = token.split(":", 1)[1]
        elif token.startswith("/PID:") or token.startswith("-PID:"):
            has_pid = True
            target_pid = token.split(":", 1)[1]

        i += 1

    if not has_im and not has_pid:
        return False, "taskkill requires /IM or /PID flag"

    # Validate process name if /IM was used
    if has_im and target_process:
        process_lower = target_process.lower()
        # Add .exe if not present
        if not process_lower.endswith('.exe'):
            process_lower = f"{process_lower}.exe"

        if process_lower in ALLOWED_PROCESS_NAMES_WINDOWS:
            return True, ""
        return False, f"taskkill only allowed for dev processes: {ALLOWED_PROCESS_NAMES_WINDOWS}"

    # Validate PID if /PID was used
    if has_pid and target_pid:
        try:
            pid = int(target_pid)
            if pid == 1 or pid == 0:
                return False, "Cannot kill system process (PID 0 or 1)"
            return True, ""  # Allow killing by PID (risky but sometimes needed)
        except ValueError:
            return False, f"Invalid PID: {target_pid}"

    return False, "Could not determine taskkill target"


def validate_del_command(command_string: str) -> Tuple[bool, str]:
    """
    Validate del/erase commands (Windows) - block dangerous patterns.

    Syntax: del /F /Q filename
            del /S /Q directory  (recursive)

    Returns:
        Tuple of (is_allowed, reason_if_blocked)
    """
    try:
        # For Windows commands, we need to handle backslashes specially
        # First, check the original command for dangerous patterns BEFORE parsing
        cmd_lower = command_string.lower()

        # Quick check for system directories in the original command
        system_dirs = ["windows", "program files", "system32", "programdata"]
        for sys_dir in system_dirs:
            if sys_dir in cmd_lower:
                return False, f"del on system directory is blocked: {command_string}"

        # Parse with shlex after normalizing slashes for proper tokenization
        # Replace backslashes with forward slashes to avoid escape interpretation
        normalized = command_string.replace("\\", "/").replace("//", "/")
        tokens = shlex.split(normalized)
    except ValueError:
        return False, "Could not parse del command"

    if not tokens:
        return False, "Empty del command"

    # Check command name
    cmd = tokens[0].lower()
    if cmd not in ("del", "erase"):
        return False, "Not a del/erase command"

    has_recursive = False  # /S flag
    has_quiet = False  # /Q flag
    targets = []

    for token in tokens[1:]:
        token_upper = token.upper()
        if token_upper in ("/S", "-S"):
            has_recursive = True
        elif token_upper in ("/Q", "-Q"):
            has_quiet = True
        elif token_upper in ("/F", "-F", "/P", "-P", "/A", "-A"):
            continue  # Other acceptable flags
        elif not token.startswith("/") and not token.startswith("-"):
            targets.append(token)

    if not targets:
        return False, "del command requires target files"

    # Block dangerous operations
    for target in targets:
        # Normalize for comparison
        normalized_target = normalize_path(target).rstrip("/\\").lower()

        # Block root drive patterns
        dangerous_roots = {"c:", "c:/", "c:\\", "d:", "d:/", "d:\\"}
        if normalized_target in dangerous_roots:
            return False, f"del on root drive is blocked: {target}"

        # Block wildcards at root level
        if normalized_target.startswith("c:") and "*" in target:
            # Check if it's directly on C: (e.g., C:\*.*, C:/*.*)
            parts = normalized_target.replace("\\", "/").split("/")
            if len(parts) <= 2:  # C: or C:/something with wildcard
                return False, f"del with wildcard at root level is blocked: {target}"

        # Block *.* pattern anywhere at root
        if "*.*" in target.lower() and ("c:" in target.lower() or "d:" in target.lower()):
            # Check depth - block if at root or one level deep
            clean_target = target.replace("\\", "/").lower()
            if clean_target.count("/") <= 1:
                return False, f"del *.* near root is blocked: {target}"

        # Block system directories (check both original and normalized)
        target_lower = target.lower().replace("\\", "/")
        system_dirs = ["windows", "program files", "system32", "programdata", "users"]
        if any(x in target_lower for x in system_dirs):
            return False, f"del on system directory is blocked: {target}"

    # Block recursive del with wildcards
    if has_recursive and any("*" in t for t in targets):
        return False, "del /S with wildcards is too dangerous"

    return True, ""


def validate_rmdir_command(command_string: str) -> Tuple[bool, str]:
    """
    Validate rmdir/rd commands (Windows) - block dangerous patterns.

    Syntax: rmdir /S /Q directory

    Returns:
        Tuple of (is_allowed, reason_if_blocked)
    """
    try:
        normalized = command_string.replace("//", "/")
        tokens = shlex.split(normalized)
    except ValueError:
        return False, "Could not parse rmdir command"

    if not tokens:
        return False, "Empty rmdir command"

    cmd = tokens[0].lower()
    if cmd not in ("rmdir", "rd"):
        return False, "Not a rmdir/rd command"

    has_recursive = False  # /S flag
    targets = []

    for token in tokens[1:]:
        token_upper = token.upper()
        if token_upper in ("/S", "-S"):
            has_recursive = True
        elif token_upper in ("/Q", "-Q"):
            continue  # Quiet flag, OK
        elif not token.startswith("/") and not token.startswith("-"):
            targets.append(token)

    if not targets:
        return False, "rmdir command requires target directory"

    # Block dangerous paths
    dangerous_paths = {
        "C:\\", "C:/", "\\", "/",
    }

    for target in targets:
        normalized_target = normalize_path(target).rstrip("/\\")

        if normalized_target in dangerous_paths:
            return False, f"rmdir on root path is blocked: {target}"

        target_lower = target.lower()
        if any(x in target_lower for x in ["windows", "program files", "system32", "users"]):
            return False, f"rmdir on system directory is blocked: {target}"

    return True, ""


# ============================================================================
# MAIN SECURITY HOOK
# ============================================================================

async def bash_security_hook(input_data, tool_use_id=None, context=None):
    """
    Pre-tool-use hook that validates bash commands using a denylist.

    Blocks only explicitly dangerous commands from BLOCKED_COMMANDS.
    All other commands are permitted.

    Cross-platform: Handles both Unix commands (pkill, rm) and
    Windows commands (taskkill, del).

    Args:
        input_data: Dict containing tool_name and tool_input
        tool_use_id: Optional tool use ID
        context: Optional context

    Returns:
        Empty dict to allow, or {"decision": "block", "reason": "..."} to block
    """
    if input_data.get("tool_name") != "Bash":
        return {}

    command = input_data.get("tool_input", {}).get("command", "")
    if not command:
        return {}

    logger.debug(f"Validating bash command: {command}")

    # Extract all commands from the command string
    commands = extract_commands(command)

    if not commands:
        # Could not parse - fail safe by blocking
        return {
            "decision": "block",
            "reason": f"Could not parse command for security validation: {command}",
        }

    # Split into segments for per-command validation
    segments = split_command_segments(command)

    # Check each command against the blocklist
    for cmd in commands:
        cmd_lower = cmd.lower()

        # Block if command is in the blocklist (unless it passes extra validation)
        if cmd_lower in BLOCKED_COMMANDS and cmd_lower not in COMMANDS_NEEDING_EXTRA_VALIDATION:
            logger.warning(f"Blocked command: {cmd} (in BLOCKED_COMMANDS)")
            return {
                "decision": "block",
                "reason": f"Command '{cmd}' is blocked for security reasons (destructive operation)",
            }

        # Additional validation for sensitive commands
        if cmd_lower in COMMANDS_NEEDING_EXTRA_VALIDATION:
            # Find the specific segment containing this command
            cmd_segment = get_command_for_validation(cmd, segments)
            if not cmd_segment:
                cmd_segment = command  # Fallback to full command

            # Route to appropriate validator
            allowed = True
            reason = ""

            # Unix process killing
            if cmd_lower == "pkill":
                allowed, reason = validate_pkill_command(cmd_segment)
            elif cmd_lower == "kill":
                allowed, reason = validate_kill_command(cmd_segment)

            # Windows process killing
            elif cmd_lower == "taskkill":
                allowed, reason = validate_taskkill_command(cmd_segment)

            # Unix file operations
            elif cmd_lower == "chmod":
                allowed, reason = validate_chmod_command(cmd_segment)
            elif cmd_lower == "rm":
                allowed, reason = validate_rm_command(cmd_segment)

            # Windows file operations
            elif cmd_lower in ("del", "erase"):
                allowed, reason = validate_del_command(cmd_segment)
            elif cmd_lower in ("rmdir", "rd"):
                allowed, reason = validate_rmdir_command(cmd_segment)

            if not allowed:
                logger.warning(f"Blocked command: {cmd} - {reason}")
                return {"decision": "block", "reason": reason}

    logger.debug(f"Allowed command: {command}")
    return {}


# ============================================================================
# PATH NORMALIZATION HOOK
# ============================================================================

async def path_normalization_hook(input_data, tool_use_id=None, context=None):
    """
    Pre-tool-use hook that normalizes file paths for cross-platform compatibility.

    Converts Git Bash style paths (/c/Users/...) to Windows paths (C:/Users/...).

    Args:
        input_data: Dict containing tool_name and tool_input
        tool_use_id: Optional tool use ID
        context: Optional context

    Returns:
        Empty dict (always allows, just normalizes paths)
    """
    tool_name = input_data.get("tool_name")
    tool_input = input_data.get("tool_input", {})

    # Tools that use file_path parameter
    path_tools = {"Read", "Write", "Edit", "Glob", "Grep"}

    if tool_name not in path_tools:
        return {}

    # Normalize file_path parameter
    if "file_path" in tool_input:
        original = tool_input["file_path"]
        normalized = normalize_path(original)
        if normalized != original:
            logger.debug(f"Normalized file_path: {original} -> {normalized}")
            tool_input["file_path"] = normalized

    # Normalize path parameter (used by some tools)
    if "path" in tool_input:
        original = tool_input["path"]
        normalized = normalize_path(original)
        if normalized != original:
            logger.debug(f"Normalized path: {original} -> {normalized}")
            tool_input["path"] = normalized

    return {}
