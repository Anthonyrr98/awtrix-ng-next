"""Inject the firmware version macro from the repo-root `version` file.

`AWTRIX_NG_VERSION` used to be a hardcoded `#define` in src/AppConfig.h that a
release had to hand-sync with the repo-root `version` file -- two sources of
truth that drifted. This pre-script makes the `version` file the single
source: it reads the string and defines
`AWTRIX_NG_VERSION` for the build, so AppConfig.h's `#define` is only a fallback
for a bare/IDE compile that runs no PlatformIO scripts.

Runs two ways:

  * as a PlatformIO pre-script (every env), defining the macro for the build
  * standalone, printing the version -- handy for release/CI tooling:

        python scripts/gen_version.py
"""

import os
import subprocess
import sys

FALLBACK = "0.0.0-dev"


def read_version(root):
    """The trimmed contents of `<root>/version`, or None if missing/empty."""
    try:
        with open(os.path.join(root, "version"), encoding="utf-8") as f:
            return f.read().strip() or None
    except OSError:
        return None


def git_value(root, *args, fallback="unknown"):
    try:
        return subprocess.check_output(
            ["git", "-C", root, *args], stderr=subprocess.DEVNULL, text=True
        ).strip() or fallback
    except (OSError, subprocess.CalledProcessError):
        return fallback


def build_identity(root):
    commit = git_value(root, "rev-parse", "--short=12", "HEAD")
    epoch = git_value(root, "show", "-s", "--format=%ct", "HEAD", fallback="0")
    try:
        dirty = subprocess.call(
            ["git", "-C", root, "diff-index", "--quiet", "HEAD", "--"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        ) != 0
    except OSError:
        dirty = False
    return commit + ("-dirty" if dirty else ""), epoch


def _platformio():
    root = env.subst("$PROJECT_DIR")  # noqa: F821
    version = read_version(root)
    if not version:
        raise SystemExit("gen_version: repo-root `version` file is missing or empty")
    build_id, build_epoch = build_identity(root)
    env.Append(CPPDEFINES=[  # noqa: F821
        ("AWTRIX_NG_VERSION", env.StringifyMacro(version)),
        ("AWTRIX_NG_BUILD_ID", env.StringifyMacro(build_id)),
        ("AWTRIX_NG_BUILD_EPOCH", env.StringifyMacro(build_epoch)),
    ])
    print("version: %s (build %s, epoch %s)" % (version, build_id, build_epoch))


try:
    Import("env")  # noqa: F821
except NameError:
    if __name__ == "__main__":
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sys.stdout.write((read_version(root) or FALLBACK) + "\n")
else:
    _platformio()
