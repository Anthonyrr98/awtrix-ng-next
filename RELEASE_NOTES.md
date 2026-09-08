## AWTRIX NG 1.6.4

**Pixel Frame themes and clearer application status cards**

- Adds Pixel Frame Dark and Pixel Frame Light to the global theme selector, with crisp two-pixel borders, offset shadows, an 8 px grid and high-contrast pixel-inspired palettes.
- Adds English, German and Simplified Chinese names for both Pixel Frame variants.
- Application cards now keep multiple status badges, such as `Script` and `Skipped`, on separate readable lines instead of squeezing their labels into vertical text.
- Cards automatically reserve enough space for multiple badges without covering the application name or action menu.
- Expands the compressed Web UI size guard from 84 KiB to 85 KiB for the two complete theme variants; the release UI remains within that limit.
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
