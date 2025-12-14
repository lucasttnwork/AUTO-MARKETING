"""
Windows Compatibility Tests
===========================

Test suite to verify cross-platform compatibility of the agent harness.
Run with: python test_windows_compatibility.py
"""

import asyncio
import platform
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from platform_utils import (
    IS_WINDOWS,
    IS_GIT_BASH,
    IS_WSL,
    get_platform_info,
    normalize_path,
    get_process_kill_command,
    command_exists,
)

from security import (
    extract_commands,
    validate_taskkill_command,
    validate_pkill_command,
    validate_del_command,
    validate_rm_command,
    validate_rmdir_command,
    bash_security_hook,
    BLOCKED_COMMANDS,
    COMMANDS_NEEDING_EXTRA_VALIDATION,
)


def print_header(title: str):
    """Print a formatted test header."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_result(test_name: str, passed: bool, details: str = ""):
    """Print a test result."""
    status = "PASS" if passed else "FAIL"
    icon = "[OK]" if passed else "[X]"
    print(f"  {icon} [{status}] {test_name}")
    if details and not passed:
        print(f"      Details: {details}")


class TestResults:
    """Track test results."""

    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []

    def add(self, name: str, passed: bool, details: str = ""):
        self.tests.append((name, passed, details))
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        print_result(name, passed, details)

    def summary(self):
        total = self.passed + self.failed
        print("\n" + "-" * 60)
        print(f"  Total: {total} | Passed: {self.passed} | Failed: {self.failed}")
        if self.failed > 0:
            print("  Failed tests:")
            for name, passed, details in self.tests:
                if not passed:
                    print(f"    - {name}: {details}")
        print("-" * 60)
        return self.failed == 0


def test_platform_detection():
    """Test platform detection functions."""
    print_header("Platform Detection Tests")
    results = TestResults()

    # Test get_platform_info
    info = get_platform_info()
    results.add(
        "get_platform_info returns dict",
        isinstance(info, dict),
        f"Got: {type(info)}"
    )

    results.add(
        "Platform info has required keys",
        all(k in info for k in ["system", "is_windows", "is_linux", "is_macos"]),
        f"Keys: {list(info.keys())}"
    )

    # Test IS_WINDOWS constant
    expected_windows = platform.system() == "Windows"
    results.add(
        "IS_WINDOWS matches platform.system()",
        IS_WINDOWS == expected_windows,
        f"IS_WINDOWS={IS_WINDOWS}, expected={expected_windows}"
    )

    return results.summary()


def test_path_normalization():
    """Test path normalization functions."""
    print_header("Path Normalization Tests")
    results = TestResults()

    # Test cases: (input, expected_on_windows, expected_on_unix)
    test_cases = [
        # Git Bash style paths
        ("/c/Users/test/file.txt", "C:/Users/test/file.txt", "/c/Users/test/file.txt"),
        ("/d/Projects/code", "D:/Projects/code", "/d/Projects/code"),

        # Already normalized paths
        ("C:/Users/test/file.txt", "C:/Users/test/file.txt", "C:/Users/test/file.txt"),
        ("./relative/path.txt", "./relative/path.txt", "./relative/path.txt"),

        # Backslash paths (should normalize on Windows)
        ("C:\\Users\\test\\file.txt", "C:/Users/test/file.txt", "C:\\Users\\test\\file.txt"),

        # Empty and edge cases
        ("", "", ""),
        ("/", "/", "/"),
    ]

    for input_path, expected_windows, expected_unix in test_cases:
        expected = expected_windows if IS_WINDOWS else expected_unix
        result = normalize_path(input_path)
        results.add(
            f"normalize_path('{input_path}')",
            result == expected,
            f"Got: '{result}', Expected: '{expected}'"
        )

    return results.summary()


def test_process_kill_commands():
    """Test process kill command generation."""
    print_header("Process Kill Command Tests")
    results = TestResults()

    # Test get_process_kill_command
    cmd = get_process_kill_command("node")

    if IS_WINDOWS:
        expected = "taskkill /F /IM node.exe"
    else:
        expected = "pkill -9 -f node"

    results.add(
        f"get_process_kill_command('node')",
        cmd == expected,
        f"Got: '{cmd}', Expected: '{expected}'"
    )

    return results.summary()


def test_command_extraction():
    """Test command extraction from shell strings."""
    print_header("Command Extraction Tests")
    results = TestResults()

    test_cases = [
        # Simple commands
        ("ls -la", ["ls"]),
        ("cat file.txt", ["cat"]),

        # Piped commands
        ("ls | grep test", ["ls", "grep"]),
        ("cat file.txt | head -10", ["cat", "head"]),

        # Chained commands
        ("cd /tmp && ls", ["cd", "ls"]),
        ("echo hello; pwd", ["echo", "pwd"]),

        # Windows commands
        ("taskkill /F /IM node.exe", ["taskkill"]),
        ("dir /B", ["dir"]),
    ]

    for cmd_string, expected_cmds in test_cases:
        result = extract_commands(cmd_string)
        results.add(
            f"extract_commands('{cmd_string}')",
            result == expected_cmds,
            f"Got: {result}, Expected: {expected_cmds}"
        )

    return results.summary()


async def test_taskkill_validation():
    """Test taskkill command validation (Windows)."""
    print_header("Taskkill Validation Tests")
    results = TestResults()

    test_cases = [
        # Valid commands
        ("taskkill /F /IM node.exe", True, "Should allow node.exe"),
        ("taskkill /F /IM npm.exe", True, "Should allow npm.exe"),
        ("taskkill /IM vite.exe", True, "Should allow vite.exe without /F"),
        ("taskkill /F /IM node", True, "Should allow without .exe"),

        # Invalid commands (dangerous processes)
        ("taskkill /F /IM explorer.exe", False, "Should block explorer.exe"),
        ("taskkill /F /IM system.exe", False, "Should block system.exe"),
        ("taskkill /F /IM cmd.exe", False, "Should block cmd.exe"),

        # Missing flags
        ("taskkill node.exe", False, "Should require /IM or /PID"),
    ]

    for cmd, should_allow, description in test_cases:
        allowed, reason = validate_taskkill_command(cmd)
        results.add(
            f"taskkill: {description}",
            allowed == should_allow,
            f"Command: '{cmd}', Allowed: {allowed}, Reason: {reason}"
        )

    return results.summary()


async def test_pkill_validation():
    """Test pkill command validation (Unix)."""
    print_header("Pkill Validation Tests")
    results = TestResults()

    test_cases = [
        # Valid commands
        ("pkill node", True, "Should allow node"),
        ("pkill -f npm", True, "Should allow npm"),
        ("pkill -9 vite", True, "Should allow vite"),

        # Invalid commands
        ("pkill bash", False, "Should block bash"),
        ("pkill init", False, "Should block init"),
        ("pkill systemd", False, "Should block systemd"),
    ]

    for cmd, should_allow, description in test_cases:
        allowed, reason = validate_pkill_command(cmd)
        results.add(
            f"pkill: {description}",
            allowed == should_allow,
            f"Command: '{cmd}', Allowed: {allowed}, Reason: {reason}"
        )

    return results.summary()


async def test_del_validation():
    """Test del command validation (Windows)."""
    print_header("Del Command Validation Tests")
    results = TestResults()

    test_cases = [
        # Valid commands
        ("del file.txt", True, "Should allow deleting single file"),
        ("del /Q temp.log", True, "Should allow quiet delete"),

        # Invalid commands
        ("del C:\\*.*", False, "Should block wildcard on root"),
        ("del /S C:\\Windows\\*", False, "Should block Windows directory"),
        ("del C:\\Program Files\\*", False, "Should block Program Files"),
    ]

    for cmd, should_allow, description in test_cases:
        allowed, reason = validate_del_command(cmd)
        results.add(
            f"del: {description}",
            allowed == should_allow,
            f"Command: '{cmd}', Allowed: {allowed}, Reason: {reason}"
        )

    return results.summary()


async def test_rm_validation():
    """Test rm command validation (Unix/Git Bash)."""
    print_header("Rm Command Validation Tests")
    results = TestResults()

    test_cases = [
        # Valid commands
        ("rm file.txt", True, "Should allow deleting single file"),
        ("rm -f temp.log", True, "Should allow force delete"),
        ("rm -rf ./node_modules", True, "Should allow deleting local directories"),

        # Invalid commands
        ("rm -rf /", False, "Should block root deletion"),
        ("rm -rf /*", False, "Should block root wildcard"),
        ("rm -rf /usr", False, "Should block system directories"),
        ("rm -rf /home", False, "Should block home directory"),
    ]

    for cmd, should_allow, description in test_cases:
        allowed, reason = validate_rm_command(cmd)
        results.add(
            f"rm: {description}",
            allowed == should_allow,
            f"Command: '{cmd}', Allowed: {allowed}, Reason: {reason}"
        )

    return results.summary()


async def test_security_hook_integration():
    """Test the main security hook with various commands."""
    print_header("Security Hook Integration Tests")
    results = TestResults()

    test_cases = [
        # Safe commands
        ({"tool_name": "Bash", "tool_input": {"command": "ls -la"}}, True, "ls should be allowed"),
        ({"tool_name": "Bash", "tool_input": {"command": "git status"}}, True, "git should be allowed"),
        ({"tool_name": "Bash", "tool_input": {"command": "npm install"}}, True, "npm should be allowed"),

        # Windows-specific
        ({"tool_name": "Bash", "tool_input": {"command": "taskkill /F /IM node.exe"}}, True, "taskkill node should be allowed"),

        # Blocked commands
        ({"tool_name": "Bash", "tool_input": {"command": "sudo rm -rf /"}}, False, "sudo should be blocked"),
        ({"tool_name": "Bash", "tool_input": {"command": "shutdown -r now"}}, False, "shutdown should be blocked"),

        # Non-bash tools should pass through
        ({"tool_name": "Read", "tool_input": {"file_path": "/etc/passwd"}}, True, "Non-bash tools pass through"),
    ]

    for input_data, should_allow, description in test_cases:
        result = await bash_security_hook(input_data)
        is_allowed = "decision" not in result
        results.add(
            f"hook: {description}",
            is_allowed == should_allow,
            f"Input: {input_data}, Result: {result}"
        )

    return results.summary()


async def run_all_tests():
    """Run all tests and report results."""
    print("\n" + "#" * 60)
    print("  WINDOWS COMPATIBILITY TEST SUITE")
    print("#" * 60)

    platform_info = get_platform_info()
    print(f"\nRunning on: {platform_info['system']}")
    print(f"Is Windows: {IS_WINDOWS}")
    print(f"Is Git Bash: {IS_GIT_BASH}")
    print(f"Is WSL: {IS_WSL}")

    all_passed = True

    # Run synchronous tests
    all_passed &= test_platform_detection()
    all_passed &= test_path_normalization()
    all_passed &= test_process_kill_commands()
    all_passed &= test_command_extraction()

    # Run async tests
    all_passed &= await test_taskkill_validation()
    all_passed &= await test_pkill_validation()
    all_passed &= await test_del_validation()
    all_passed &= await test_rm_validation()
    all_passed &= await test_security_hook_integration()

    # Final summary
    print("\n" + "#" * 60)
    if all_passed:
        print("  ALL TESTS PASSED!")
    else:
        print("  SOME TESTS FAILED - See details above")
    print("#" * 60 + "\n")

    return 0 if all_passed else 1


if __name__ == "__main__":
    exit_code = asyncio.run(run_all_tests())
    sys.exit(exit_code)
