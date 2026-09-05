## AWTRIX NG 1.2.0

This release expands the on-device app system, animation controls, rotation management and
backup coverage.

**Added**

- **16 ready-to-install Berry apps** in `examples/apps`: Bilibili Fans, Matrix Rain, Looking Eyes,
  Fireworks, Color Waves, Radar, Pacifica, Twinkling Stars, Snake Visual, Binary Clock, Dice,
  Plasma Clock, Pomodoro, Game of Life, Moon Phase and Light Chart.
- **Rotation scenes.** Save the current app order and disabled-app set as a named scene, then apply,
  update or delete it from the Apps page. Up to 16 scenes are stored on the device.
- **More effect controls.** Berry apps and structured effect settings accept `density` (0–100),
  `trail` (1–64) and `intensity` (0–100), in addition to speed, palette and blending.
- Matrix supports density, trail length and intensity. Fireworks and Twinkling Stars support
  density and intensity.
- Backup now includes **radio stations**, plus app order and all saved rotation scenes.
- A **Select all** option in Backup, enabled by default, makes complete backups a single click.

**Changed**

- The Fireworks and Twinkling Stars example apps expose density and brightness in their generated
  configuration panels.
- The downloadable Berry app authoring skill and scripting documentation describe the new effect
  controls.
- Existing app-order files and version 1 backup archives remain compatible.

---

**Which file do I need?**

| Your board | Update a running AWTRIX NG | First install over USB |
|---|---|---|
| Classic ESP32, Ulanzi TC001, AWTRIX 2 conversions | `firmware-awtrix-ng.bin` | An image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with octal PSRAM (`N8R8`, `N16R8`) or no PSRAM | `firmware-awtrix-ng-s3-octal.bin` | The matching S3 octal image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with quad PSRAM (`N8R2`, `N16R2`, `N4R2`) | `firmware-awtrix-ng-s3-quad.bin` | The matching S3 quad image inside `usb-awtrix-ng.zip` |

For the ESP32-S3 N16R8 used to test this release, choose
`firmware-awtrix-ng-s3-octal.bin` when updating from the device Web UI.
