<div align="center">

<img src="docs/assets/hero.webp" alt="AWTRIX NG running on an LED matrix" width="800">

# AWTRIX NG

**A modern, extensible firmware for ESP32-powered pixel displays.**

AWTRIX NG is the from-scratch successor to AWTRIX 3. It turns a 32–128 × 8
WS2812-style LED matrix into a local, networked information display with built-in
apps, HTTP and MQTT integrations, on-device scripting, audio, sensors, and a full
browser-based control panel.

[![CI](https://github.com/Anthonyrr98/awtrix-ng-next/actions/workflows/ci.yml/badge.svg)](https://github.com/Anthonyrr98/awtrix-ng-next/actions/workflows/ci.yml)
[![Docs](https://github.com/Anthonyrr98/awtrix-ng-next/actions/workflows/docs.yml/badge.svg)](https://github.com/Anthonyrr98/awtrix-ng-next/actions/workflows/docs.yml)
[![Latest release](https://img.shields.io/github/v/release/Anthonyrr98/awtrix-ng-next?sort=semver&label=release)](https://github.com/Anthonyrr98/awtrix-ng-next/releases/latest)
![Platform](https://img.shields.io/badge/platform-ESP32%20%7C%20ESP32--S3-blue)
[![License](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-lightgrey)](LICENSE.md)

[Documentation](https://anthonyrr98.github.io/awtrix-ng-next/) ·
[Install](https://anthonyrr98.github.io/awtrix-ng-next/getting-started/flashing/) ·
[Latest release](https://github.com/Anthonyrr98/awtrix-ng-next/releases/latest) ·
[HTTP API](https://anthonyrr98.github.io/awtrix-ng-next/reference/http/) ·
[Scripting](https://anthonyrr98.github.io/awtrix-ng-next/guides/scripting/) ·
[Discord](https://discord.gg/5pbmeCrs3a)

</div>

---

## Project status

The current stable release is **v1.6.4**. AWTRIX NG is actively developed and
already suitable for daily use. Recent releases added:

- six global Web UI themes: Light, Dark, Liquid Glass White, Liquid Glass Color,
  Pixel Frame Light, and Pixel Frame Dark;
- English, German, and Simplified Chinese user interfaces with an extensible
  localization structure;
- a built-in Berry script example library and improved app rotation management;
- optional Windows system-audio visualization;
- backup and restore, signed OTA manifests, and release-asset verification;
- ESP32-S3 builds for both octal- and quad-PSRAM boards.

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for the complete release history.

## Highlights

| Area | What it provides |
| --- | --- |
| Display | Scrolling and colored text, icons, JPEG/GIF playback, charts, drawing primitives, palettes, overlays, transitions, and animated effects |
| Apps | Built-in clock and sensor apps, pushed apps, notifications, rotation scenes, and Berry apps that run directly on the device |
| Integrations | HTTP API v1, MQTT with Home Assistant auto-discovery, Art-Net, mDNS, and UDP discovery |
| Web UI | Live matrix preview, app manager, script editor, icon and palette editors, audio controls, logs, firmware updates, themes, localization, and backups |
| Sensors | Auto-detected BME280, BMP280, HTU21DF, and SHT31 sensors, plus LDR auto-brightness and battery monitoring |
| Audio | RTTTL buzzer melodies, I2S MP3 playback, DFPlayer tracks, and internet radio on PSRAM-equipped boards |
| Reliability | Script isolation, persistent settings, health diagnostics, signed OTA metadata, and native simulator/test targets |

Everything is hosted on the device. Normal operation does not require an app,
account, cloud service, or always-on home server.

## Quick start

### 1. Install the firmware

For a first installation, use the
[browser flasher](https://anthonyrr98.github.io/awtrix-ng-next/getting-started/flashing/)
with a Chromium-based browser, or download the USB bundle from the
[latest GitHub release](https://github.com/Anthonyrr98/awtrix-ng-next/releases/latest).

> A first installation over USB erases the device. Later releases can be installed
> from **System → Maintenance** in the Web UI; OTA updates preserve settings and files.

### 2. Connect it to Wi-Fi

On first boot the device creates a setup access point. Join it, enter the target
Wi-Fi credentials, and wait for the device to restart. See the
[first-boot guide](https://anthonyrr98.github.io/awtrix-ng-next/getting-started/first-boot/)
if the captive portal does not open automatically.

### 3. Open the Web UI

Visit `http://awtrix-ng.local/` or the IP address shown by your router. The Web UI
is the main place to configure hardware, arrange apps, edit scripts, manage media,
select a theme, inspect logs, and update the firmware.

### 4. Send a notification

```bash
curl -X POST http://awtrix-ng.local/api/v1/notifications \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","textColor":"#FF0000"}'
```

Any system that can make an HTTP request can use the display, including Home
Assistant, Node-RED, shell scripts, CI jobs, and small desktop utilities. MQTT is
available for event-driven integrations and Home Assistant discovery.

## Choose the correct firmware

| Hardware | OTA update asset | First-time USB image |
| --- | --- | --- |
| Classic ESP32, Ulanzi TC001, AWTRIX 2, and typical DIY boards | `firmware-awtrix-ng.bin` | The matching ESP32 image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with octal PSRAM, including N8R8/N16R8 layouts | `firmware-awtrix-ng-s3-octal.bin` | The matching S3 octal image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with quad PSRAM, including N4R2/N8R2/N16R2 layouts | `firmware-awtrix-ng-s3-quad.bin` | The matching S3 quad image inside `usb-awtrix-ng.zip` |

If the board uses a custom pinout, select the matching architecture above and
configure the pins in the Web UI. Do not flash an S3 PSRAM variant based only on
flash capacity—the PSRAM wiring must match.

## Run apps on the device

AWTRIX NG embeds the [Berry](https://berry-lang.github.io/) scripting language.
Scripts are created and edited in the browser, persist across restarts, and join
the display rotation like built-in apps.

```berry
class Counter
  var value

  def init()
    self.value = 0
  end

  def loop()
    self.value = (self.value + 1) % 100
  end

  def draw()
    text(1, 1, str(self.value), 0x00FFAA)
  end
end

return Counter()
```

Scripts can keep state, access settings, make HTTP requests, use MQTT, and draw
with the firmware's visual primitives. A failing script is isolated so it does not
take down the display. The Web UI also includes an example library with clocks,
weather views, ambient animations, games, progress displays, and API-driven apps.

Read the [scripting guide](https://anthonyrr98.github.io/awtrix-ng-next/guides/scripting/)
for the lifecycle, API, modules, limits, and complete examples.

## Windows system-audio visualizer

The optional `awtrix-music-visualizer.exe` captures the Windows system-output mix
through WASAPI and streams a real-time spectrum to AWTRIX NG. Download it from the
[latest release](https://github.com/Anthonyrr98/awtrix-ng-next/releases/latest),
start the executable, and enter the device URL when prompted.

The companion must remain running while visualization is active. When it exits,
normal app rotation resumes. Installation and troubleshooting are covered in the
[music visualizer guide](https://anthonyrr98.github.io/awtrix-ng-next/advanced/music-visualizer/).

## Supported hardware

- Classic ESP32 and ESP32-S3 boards
- 8-pixel-high WS2812-compatible matrices from 32 to 128 pixels wide
- Original AWTRIX hardware, Ulanzi TC001, AWTRIX 2 conversions, and DIY builds
- Optional I2C environmental sensors, LDR, battery measurement, buzzer, I2S audio,
  and DFPlayer hardware

PSRAM is strongly recommended for larger assets and is required for internet
radio. Pin assignments and optional peripherals are configured at runtime rather
than requiring a separate firmware build for every board.

## Building from source

### Requirements

- [PlatformIO](https://platformio.org/)
- Python 3
- Node.js (used to build and minify the embedded Web UI)

Clone the repository, open its root directory, and select an environment:

```bash
pio run -e awtrix             # classic ESP32
pio run -e awtrix_s3_octal    # ESP32-S3 with octal PSRAM
pio run -e awtrix_s3_quad     # ESP32-S3 with quad PSRAM
```

To build and upload over USB:

```bash
pio run -e awtrix -t upload
```

See the [build guide](https://anthonyrr98.github.io/awtrix-ng-next/advanced/building/)
for toolchain setup, partitions, generated assets, and board-specific details.

## Testing and simulator

```bash
pio test -e native -v
pio run -e native_sim
```

Run `.pio/build/native_sim/program` on Linux/macOS or
`.pio\build\native_sim\program.exe` on Windows. The simulator uses the real core,
script engine, and Web UI without requiring a physical matrix.

Web UI and flow-converter tests can be run separately:

```bash
cd webui/test
npm ci
npm test

node --test "../../tools/flowconv/*.test.mjs"
```

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/core/` | Portable C++17 application and rendering logic |
| `src/hal/` | ESP32 and native hardware abstraction |
| `src/transport/` | HTTP, MQTT, discovery, and related transports |
| `src/persistence/` | Settings and file persistence |
| `webui/` | Embedded browser interface |
| `docs/` | MkDocs documentation source |
| `test/` | Native firmware tests |
| `tools/` | Build, packaging, conversion, and companion utilities |
| `.github/workflows/` | CI, documentation, and release automation |

## Migrating from AWTRIX 3

AWTRIX NG is a new implementation with its own API v1. Existing AWTRIX 3 settings,
files, and integrations are not migrated automatically, and v3 API clients may
need changes. Treat the first installation as a clean setup and follow the
[migration guide](https://anthonyrr98.github.io/awtrix-ng-next/guides/migrating-from-awtrix3/).

## Documentation

- [Getting started](https://anthonyrr98.github.io/awtrix-ng-next/getting-started/flashing/)
- [HTTP API](https://anthonyrr98.github.io/awtrix-ng-next/reference/http/)
- [MQTT reference](https://anthonyrr98.github.io/awtrix-ng-next/reference/mqtt/)
- [On-device scripting](https://anthonyrr98.github.io/awtrix-ng-next/guides/scripting/)
- [Firmware updates](https://anthonyrr98.github.io/awtrix-ng-next/guides/updating/)
- [Desktop simulator](https://anthonyrr98.github.io/awtrix-ng-next/advanced/simulator/)

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before
submitting a change. Reports from less-common boards and reusable script examples
are especially useful.

Please report security issues according to [SECURITY.md](SECURITY.md), not through
the public issue tracker.

## License

AWTRIX NG is distributed under the
[PolyForm Noncommercial License 1.0.0](LICENSE.md). It is source-available but not
OSI-approved open source: noncommercial use, modification, and redistribution are
permitted under the license; commercial use requires separate permission.

Copyright © Stephan Mühl
([Blueforcer](https://github.com/Blueforcer)). Third-party notices are listed in
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
