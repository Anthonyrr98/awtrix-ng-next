## AWTRIX NG 1.4.0

**New features**

- The System page can run an MQTT round-trip test through the configured broker and report the result immediately.
- The maintenance panel can check GitHub Releases for a newer version, select the correct firmware for the current board, and install it online.
- CI now reports firmware usage for every hardware target and fails when an image exceeds 90% of its OTA partition.

**Improvements**

- The version API now identifies the exact OTA image required by the running hardware, preventing cross-flashing between classic, S3 octal, and S3 quad targets.
- Online updates show the available version and link to its release notes before installation.

**Compatibility**

- Existing settings, scripts, applications, MQTT credentials, groups, scenes, and backups are preserved.
- Manual firmware upload remains available for offline recovery and development builds.

---

**Which file do I need?**

| Your board | Update a running AWTRIX NG | First install over USB |
|---|---|---|
| Classic ESP32, Ulanzi TC001, AWTRIX 2 conversions | `firmware-awtrix-ng.bin` | An image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with octal PSRAM (`N8R8`, `N16R8`) or no PSRAM | `firmware-awtrix-ng-s3-octal.bin` | The matching S3 octal image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with quad PSRAM (`N8R2`, `N16R2`, `N4R2`) | `firmware-awtrix-ng-s3-quad.bin` | The matching S3 quad image inside `usb-awtrix-ng.zip` |

For the ESP32-S3 N16R8 used to test this release, choose `firmware-awtrix-ng-s3-octal.bin` for an OTA update.
