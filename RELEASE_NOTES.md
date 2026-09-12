## AWTRIX NG 1.6.5

**GIF Gallery playback and clearer PSRAM usage**

- Adds the built-in `GIFGallery` app, which plays uploaded GIF icons as an ordered playlist.
- Adds a visual GIF picker with add/remove controls and playback-order buttons; manual comma-separated ID entry is no longer required.
- Adds two playback modes: follow the normal application rotation and resume at the previous GIF, or remain in GIF Gallery and loop continuously.
- Keeps the last decoded GIF frame visible between animation deadlines, preventing black-frame flicker on the display.
- Refreshes the GIF file list automatically so newly uploaded icons become available without restarting the device.
- Shows PSRAM as used memory divided by total memory on the Dashboard.
- Existing configurations, scripts, applications, media, scenes, themes and MQTT credentials are preserved. No migration is required.

---

## Which file should I use?

| Hardware | Web UI OTA update | First install over USB |
| --- | --- | --- |
| Original ESP32 / Ulanzi TC001 / AWTRIX 2 conversions | `firmware-awtrix-ng.bin` | The matching ESP32 image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with octal PSRAM (`N8R8`, `N16R8`) or no PSRAM | `firmware-awtrix-ng-s3-octal.bin` | The matching S3 octal image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with quad PSRAM (`N8R2`, `N16R2`, `N4R2`) | `firmware-awtrix-ng-s3-quad.bin` | The matching S3 quad image inside `usb-awtrix-ng.zip` |

For the ESP32-S3 N16R8 used to test this release, choose `firmware-awtrix-ng-s3-octal.bin` for an OTA update.

Windows users can download `awtrix-music-visualizer.exe`, run it, and enter the AWTRIX NG device address. The companion is optional and does not change firmware requirements.
