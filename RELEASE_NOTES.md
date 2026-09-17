## AWTRIX NG 1.6.8

**Windows desktop preview**

- Adds `awtrix-desktop-preview.exe`, a small native Windows companion that mirrors the live LED
  matrix without keeping a browser open.
- The preview is resizable, can remain always on top, minimizes to the notification area, supports
  10/20/30 FPS refresh rates and can start with Windows.
- The companion connects directly to `GET /api/v1/display/screen`, never overlaps requests and has
  no cloud service or analytics.

**Compatibility and stability fixes**

The following fixes were adapted from Blueforcer/awtrix-ng 1.1.1 and integrated with the features
and modular Web UI in AWTRIX NG Next:

- Empty `soundRtttl` values now mean “no melody” instead of rejecting the whole notification.
- A pushed application can replace a built-in with the same name, including `Time`, sensor pages
  and `GIFGallery`; an installed Berry script still has priority over a pushed application.
- Invalid JPEG icons, including PNG data stored under a `.jpg` name, are reported and fall back to
  the text layout instead of leaving an unexplained black gap.
- Time zones unsupported by the current browser are omitted without aborting the System page.
- Files inside downloaded backup ZIP archives carry the backup creation time instead of an invalid
  1979/1601 timestamp.
- ESP32-S3 I2S clock and data lines are held low until playback starts, preventing amplifier noise
  before the first stream.

**Compatibility**

- Existing settings, scripts, applications, icons, media, scenes, themes and MQTT credentials are
  preserved. No migration is required.
- The desktop preview currently requires Web UI authentication to be disabled and is intended for
  trusted local networks.

---

## Which file should I use?

| Hardware | Web UI OTA update | First install over USB |
| --- | --- | --- |
| Original ESP32 / Ulanzi TC001 / AWTRIX 2 conversions | `firmware-awtrix-ng.bin` | The matching ESP32 image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with octal PSRAM (`N8R8`, `N16R8`) or no PSRAM | `firmware-awtrix-ng-s3-octal.bin` | The matching S3 octal image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with quad PSRAM (`N8R2`, `N16R2`, `N4R2`) | `firmware-awtrix-ng-s3-quad.bin` | The matching S3 quad image inside `usb-awtrix-ng.zip` |

For the ESP32-S3 N16R8 used to test this release, choose
`firmware-awtrix-ng-s3-octal.bin` for an OTA update.

Windows users can also download `awtrix-desktop-preview.exe` and
`awtrix-music-visualizer.exe`. Both companions are optional and do not change firmware
requirements.
