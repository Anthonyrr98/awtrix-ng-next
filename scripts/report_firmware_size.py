#!/usr/bin/env python3
"""Report OTA slot usage and fail before a release runs out of update space."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


def number(value: str) -> int:
    return int(value.strip(), 0)


def app_slot(partitions: Path) -> int:
    with partitions.open(newline="", encoding="utf-8") as handle:
        for row in csv.reader(line for line in handle if not line.lstrip().startswith("#")):
            if len(row) >= 5 and row[1].strip() == "app":
                return number(row[4])
    raise SystemExit(f"no app partition in {partitions}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env", required=True)
    parser.add_argument("--summary")
    parser.add_argument("--warn-percent", type=float, default=88.0)
    parser.add_argument("--limit-percent", type=float, default=90.0)
    args = parser.parse_args()

    build = Path(".pio") / "build" / args.env
    firmware = build / "firmware.bin"
    partitions = build / "partitions.csv"
    used, capacity = firmware.stat().st_size, app_slot(partitions)
    percent = used * 100.0 / capacity
    free = capacity - used
    line = (
        f"| `{args.env}` | {used:,} B | {capacity:,} B | "
        f"{free:,} B | {percent:.1f}% |\n"
    )
    print(line.strip())
    if args.summary:
        summary = Path(args.summary)
        new = not summary.exists() or summary.stat().st_size == 0
        with summary.open("a", encoding="utf-8") as handle:
            if new:
                handle.write("## Firmware size\n\n| Target | Firmware | OTA slot | Free | Used |\n")
                handle.write("|---|---:|---:|---:|---:|\n")
            handle.write(line)
    if percent >= args.limit_percent:
        print(f"::error::firmware uses {percent:.1f}% of its OTA slot; limit is {args.limit_percent:.1f}%")
        return 1
    if percent >= args.warn_percent:
        print(f"::warning::firmware uses {percent:.1f}% of its OTA slot; warning starts at {args.warn_percent:.1f}%")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
