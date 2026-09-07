#!/usr/bin/env python3
"""Stream a Windows system-audio spectrum to an AWTRIX pushed app."""

from __future__ import annotations

import argparse
import base64
import json
import math
import queue
import sys
import threading
import time
import urllib.error
import urllib.request
import warnings

try:
    import numpy as np
    import soundcard as sc
except ImportError as error:
    raise SystemExit(
        "Missing dependency. Run: python -m pip install numpy soundcard"
    ) from error


PALETTES = {
    "neon": ((20, 235, 255), (132, 70, 255), (255, 40, 145)),
    "fire": ((255, 210, 40), (255, 92, 20), (255, 20, 45)),
    "ocean": ((20, 100, 255), (20, 230, 210), (170, 255, 90)),
    "mono": ((45, 150, 255), (115, 205, 255), (240, 250, 255)),
}
KEEP_ACTIVE_SECONDS = 15.0


def gradient(stops: tuple[tuple[int, int, int], ...], value: float) -> tuple[int, int, int]:
    value = min(1.0, max(0.0, value)) * (len(stops) - 1)
    index = min(len(stops) - 2, int(value))
    part = value - index
    return tuple(round(a + (b - a) * part) for a, b in zip(stops[index], stops[index + 1]))


def spectrum(samples: np.ndarray, rate: int, bands: int, low: float, high: float) -> np.ndarray:
    """Return logarithmic frequency-band power, before display normalization."""
    mono = samples.mean(axis=1) if samples.ndim == 2 else samples
    mono = mono.astype(np.float32, copy=False)
    if not mono.size:
        return np.zeros(bands, dtype=np.float32)
    fft = np.abs(np.fft.rfft(mono * np.hanning(mono.size)))
    frequencies = np.fft.rfftfreq(mono.size, 1.0 / rate)
    edges = np.geomspace(max(20.0, low), min(rate / 2, high), bands + 1)
    result = np.zeros(bands, dtype=np.float32)
    for index in range(bands):
        mask = (frequencies >= edges[index]) & (frequencies < edges[index + 1])
        if np.any(mask):
            result[index] = math.sqrt(float(np.mean(np.square(fft[mask]))))
    return result


def bitmap(levels: np.ndarray, peaks: np.ndarray, width: int, height: int,
           palette: tuple[tuple[int, int, int], ...]) -> str:
    pixels = bytearray(width * height * 3)
    for x in range(width):
        lit = min(height, max(0, round(float(levels[x]) * height)))
        peak = min(height - 1, max(0, round(float(peaks[x]) * (height - 1))))
        for row in range(lit):
            y = height - 1 - row
            color = gradient(palette, row / max(1, height - 1))
            offset = (y * width + x) * 3
            pixels[offset:offset + 3] = bytes(color)
        if lit and peak >= lit:
            y = height - 1 - peak
            offset = (y * width + x) * 3
            pixels[offset:offset + 3] = bytes(gradient(palette, peak / max(1, height - 1)))
    return base64.b64encode(pixels).decode("ascii")


class Awtrix:
    def __init__(self, url: str, name: str, auth: str | None, timeout: float):
        self.url = url.rstrip("/")
        self.name = name
        self.timeout = timeout
        self.auth = None if not auth else "Basic " + base64.b64encode(auth.encode()).decode()

    def request(self, method: str, path: str, body: dict | None = None) -> None:
        data = None if body is None else json.dumps(body, separators=(",", ":")).encode()
        request = urllib.request.Request(self.url + path, data=data, method=method)
        if data is not None:
            request.add_header("Content-Type", "application/json")
        if self.auth:
            request.add_header("Authorization", self.auth)
        with urllib.request.urlopen(request, timeout=self.timeout) as response:
            if response.status >= 300:
                raise RuntimeError(f"AWTRIX returned HTTP {response.status}")

    def frame(self, encoded: str, width: int, height: int) -> None:
        self.request("PUT", f"/api/v1/apps/pushed/{self.name}", {
            "draw": [["bitmap", 0, 0, width, height, encoded]],
            "durationMs": 60000,
            "lifetimeMs": 2500,
            "lifetimeExpiry": "remove",
        })

    def show(self) -> None:
        self.request("PUT", "/api/v1/apps/active", {"name": self.name, "fast": True})

    def remove(self) -> None:
        self.request("DELETE", f"/api/v1/apps/{self.name}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", nargs="?", help="AWTRIX URL, for example http://192.168.1.20")
    parser.add_argument("--name", default="music_visualizer")
    parser.add_argument("--auth", help="optional Web UI user:password")
    parser.add_argument("--device", help="speaker name substring; defaults to the system output")
    parser.add_argument("--list-devices", action="store_true")
    parser.add_argument("--palette", choices=PALETTES, default="neon")
    parser.add_argument("--width", type=int, default=32)
    parser.add_argument("--height", type=int, default=8)
    parser.add_argument("--fps", type=float, default=20.0)
    parser.add_argument("--sample-rate", type=int, default=48000)
    parser.add_argument("--fft-size", type=int, default=2048)
    parser.add_argument("--low-hz", type=float, default=55.0)
    parser.add_argument("--high-hz", type=float, default=16000.0)
    parser.add_argument("--gain", type=float, default=1.35)
    parser.add_argument("--no-peak", action="store_true")
    parser.add_argument("--keep-app", action="store_true")
    parser.add_argument("--duration", type=float, help=argparse.SUPPRESS)
    args = parser.parse_args()
    interactive_launch = not args.url and not args.list_devices

    if args.width < 1 or args.height < 1:
        parser.error("--width and --height must be positive")
    if args.fft_size < 256:
        parser.error("--fft-size must be at least 256")
    if args.low_hz <= 0 or args.high_hz <= args.low_hz:
        parser.error("frequency range must satisfy 0 < --low-hz < --high-hz")

    # HTTP frame delivery intentionally leaves small gaps between loopback reads.
    # SoundCard reports each harmless gap; suppress that expected warning so the
    # command remains usable while preserving all unrelated warnings.
    warnings.filterwarnings(
        "ignore",
        message="data discontinuity in recording",
        category=getattr(sc, "SoundcardRuntimeWarning", Warning),
    )

    speakers = sc.all_speakers()
    if args.list_devices:
        default = sc.default_speaker()
        for item in speakers:
            print(("* " if default and item.name == default.name else "  ") + item.name)
        return 0
    if not args.url:
        print("AWTRIX NG System Audio Visualizer")
        print("Enter the device address, for example http://192.168.1.20")
        try:
            args.url = input("Device address: ").strip()
        except EOFError:
            args.url = ""
        if not args.url:
            print("No device address entered. Cancelled.")
            return 2
    if not args.url.startswith(("http://", "https://")):
        args.url = "http://" + args.url
    speaker = sc.default_speaker()
    if args.device:
        speaker = next((item for item in speakers if args.device.lower() in item.name.lower()), None)
        if speaker is None:
            raise SystemExit(f"No output device contains: {args.device}")
    if speaker is None:
        raise SystemExit("No default Windows output device found")

    microphone = sc.get_microphone(speaker.name, include_loopback=True)
    awtrix = Awtrix(args.url, args.name, args.auth, 3.0)
    captures: queue.Queue[tuple[np.ndarray | None, Exception | None]] = queue.Queue(maxsize=1)
    capture_stop = threading.Event()

    def capture() -> None:
        try:
            with microphone.recorder(samplerate=args.sample_rate, channels=2,
                                     blocksize=args.fft_size) as recorder:
                while not capture_stop.is_set():
                    item = (recorder.record(numframes=args.fft_size), None)
                    try:
                        captures.put_nowait(item)
                    except queue.Full:
                        try:
                            captures.get_nowait()
                        except queue.Empty:
                            pass
                        captures.put_nowait(item)
        except Exception as error:
            try:
                captures.put_nowait((None, error))
            except queue.Full:
                pass

    threading.Thread(target=capture, name="audio-loopback", daemon=True).start()
    levels = np.zeros(args.width, dtype=np.float32)
    peaks = np.zeros(args.width, dtype=np.float32)
    floor = 1e-4
    source_label = "the selected system output" if args.device else "the default system output"
    print(f"Capturing {source_label}; Ctrl+C stops")
    period = 1.0 / min(30.0, max(5.0, args.fps))
    deadline = None if args.duration is None else time.monotonic() + max(0.0, args.duration)
    last_show = 0.0
    try:
        while True:
            if deadline is not None and time.monotonic() >= deadline:
                break
            started = time.monotonic()
            samples, capture_error = captures.get(timeout=1.0)
            if capture_error:
                raise capture_error
            assert samples is not None
            raw = spectrum(samples, args.sample_rate, args.width, args.low_hz, args.high_hz)
            maximum = max(floor, float(np.percentile(raw, 92)))
            floor = floor * 0.94 + maximum * 0.06
            target = np.clip(np.log1p(raw / max(1e-6, floor) * args.gain) / math.log(3.2), 0, 1)
            levels = np.maximum(target, levels * 0.72)
            peaks = levels.copy() if args.no_peak else np.maximum(levels, peaks - 0.035)
            awtrix.frame(bitmap(levels, peaks, args.width, args.height, PALETTES[args.palette]),
                         args.width, args.height)
            if started - last_show >= KEEP_ACTIVE_SECONDS:
                awtrix.show()
                last_show = started
            time.sleep(max(0.0, period - (time.monotonic() - started)))
    except KeyboardInterrupt:
        print("\nStopped")
    except (urllib.error.URLError, OSError, queue.Empty) as error:
        print(f"Stopped: {error}")
        if interactive_launch:
            try:
                input("Press Enter to exit...")
            except (EOFError, KeyboardInterrupt):
                pass
        return 1
    finally:
        capture_stop.set()
        if not args.keep_app:
            try:
                awtrix.remove()
            except Exception:
                pass
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SystemExit:
        raise
    except Exception as error:
        print(f"\nFailed: {error}", file=sys.stderr)
        if sys.stdin.isatty():
            try:
                input("Press Enter to exit...")
            except (EOFError, KeyboardInterrupt):
                pass
        raise SystemExit(1) from error
