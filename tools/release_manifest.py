#!/usr/bin/env python3
"""Build the machine-readable checksum manifest consumed by the device updater."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("assets", nargs="+", type=Path)
    parser.add_argument("--version-file", type=Path, default=Path("version"))
    parser.add_argument("--output", type=Path, default=Path("release-manifest.json"))
    args = parser.parse_args()

    version = args.version_file.read_text(encoding="utf-8").strip().removeprefix("v")
    if not version:
        raise SystemExit("version file is empty")

    assets: dict[str, dict[str, object]] = {}
    for path in args.assets:
        data = path.read_bytes()
        assets[path.name] = {"sha256": hashlib.sha256(data).hexdigest(), "size": len(data)}

    manifest = {"schema": 1, "version": version, "assets": assets}
    args.output.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
