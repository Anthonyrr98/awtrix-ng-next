#!/usr/bin/env python3
"""Sample a running AWTRIX device and fail on sustained health regressions."""

from __future__ import annotations

import argparse
import base64
import json
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def fetch(url: str, auth: str | None, timeout: float) -> dict:
    request = urllib.request.Request(url.rstrip("/") + "/api/v1/device")
    if auth:
        request.add_header("Authorization", "Basic " + base64.b64encode(auth.encode()).decode())
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.load(response)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="device base URL, for example http://192.168.1.20")
    parser.add_argument("--hours", type=float, default=24.0)
    parser.add_argument("--interval", type=float, default=60.0)
    parser.add_argument("--timeout", type=float, default=10.0)
    parser.add_argument("--auth", help="optional user:password")
    parser.add_argument("--output", type=Path, default=Path("soak-results.jsonl"))
    parser.add_argument("--min-heap", type=int, default=64 * 1024)
    parser.add_argument("--min-block", type=int, default=48 * 1024)
    parser.add_argument("--max-failures", type=int, default=3)
    args = parser.parse_args()

    deadline = time.monotonic() + max(0.0, args.hours) * 3600
    failures = samples = reconnects = 0
    lowest_heap = lowest_block = None
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("a", encoding="utf-8") as log:
        while True:
            stamp = datetime.now(timezone.utc).isoformat()
            try:
                state = fetch(args.url, args.auth, args.timeout)
                samples += 1
                heap = int(state.get("freeHeapBytes", 0))
                block = int(state.get("largestFreeBlockBytes", 0))
                lowest_heap = heap if lowest_heap is None else min(lowest_heap, heap)
                lowest_block = block if lowest_block is None else min(lowest_block, block)
                reconnects = max(reconnects, int(state.get("wifi", {}).get("connects", 0)) - 1)
                record = {"at": stamp, "ok": True, "state": state}
            except Exception as error:  # network failures are part of the soak result
                failures += 1
                record = {"at": stamp, "ok": False, "error": str(error)}
            log.write(json.dumps(record, separators=(",", ":")) + "\n")
            log.flush()
            print(json.dumps(record, ensure_ascii=False))
            if time.monotonic() >= deadline:
                break
            time.sleep(max(1.0, min(args.interval, deadline - time.monotonic())))

    healthy = (
        samples > 0 and failures <= args.max_failures and
        lowest_heap is not None and lowest_heap >= args.min_heap and
        lowest_block is not None and lowest_block >= args.min_block
    )
    print(f"samples={samples} failures={failures} wifi_reconnects={reconnects} "
          f"lowest_heap={lowest_heap} lowest_block={lowest_block} healthy={healthy}")
    return 0 if healthy else 1


if __name__ == "__main__":
    raise SystemExit(main())
