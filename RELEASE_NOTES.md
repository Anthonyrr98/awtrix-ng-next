## AWTRIX NG 1.6.3

**System-audio visualizer and Web UI refinements**

- Adds `awtrix-music-visualizer.exe`, a self-contained Windows companion that captures the default system output through WASAPI and streams a real-time FFT spectrum to AWTRIX NG.
- The visualizer offers neon, fire, ocean and monochrome palettes, automatic level adaptation, smoothing and peak falloff.
- The visualizer keeps its pushed app active for the whole capture session instead of being replaced by normal app rotation; stopping it removes the temporary app and restores rotation.
- Double-clicking the visualizer opens an English setup prompt. Python is not required on the destination computer.
- Application tile action menus now open upward, preventing the bottom row from being clipped.
- Application status badges have a reserved layout area and no longer overlap the action button.
- Existing configurations, scripts, applications, media, scenes and MQTT credentials are preserved.

---

## Which file should I use?

| Hardware | Web UI OTA update | First install over USB |
| --- | --- | --- |
| Original ESP32 / Ulanzi TC001 / AWTRIX 2 conversions | `firmware-awtrix-ng.bin` | The matching ESP32 image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with octal PSRAM (`N8R8`, `N16R8`) or no PSRAM | `firmware-awtrix-ng-s3-octal.bin` | The matching S3 octal image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with quad PSRAM (`N8R2`, `N16R2`, `N4R2`) | `firmware-awtrix-ng-s3-quad.bin` | The matching S3 quad image inside `usb-awtrix-ng.zip` |

For the ESP32-S3 N16R8 used to test this release, choose `firmware-awtrix-ng-s3-octal.bin` for an OTA update.

Windows users can download `awtrix-music-visualizer.exe`, run it, and enter the AWTRIX NG device address. The companion is optional and does not change firmware requirements.
