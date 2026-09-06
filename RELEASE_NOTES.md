## AWTRIX NG 1.4.2

**Stability and update safety**

- Production ESP32-S3 builds retain the hardware brownout detector. Unsafe brownout-disabled builds are isolated in explicitly named bench-only environments and are never release targets.
- New OTA firmware stays pending until setup, services, rendering, and 300 main-loop frames complete successfully. A crash or reboot before validation automatically rolls back to the previous partition.
- Releases include SHA-256 checksums in a machine-readable manifest. Online updates verify every received byte before activating the new image.
- Online installation first downloads a safety backup of configuration, credentials, scripts, icons, palettes, app order, scenes, and radio stations. Large MP3 media is excluded.
- Update failures now report the specific validation, checksum, or flash-writer error.

**Update experience**

- The maintenance page reports backup, download, verification, upload, and reboot phases separately.
- The stable update channel only accepts verified GitHub Release manifests and never falls back to development files from `main`.
- The Scripts page shows installed capacity, counts modules toward the limit, and explains how to recover before a new install fails.
- Sixteen built-in Berry examples can be browsed, previewed, and installed without overwriting an existing script.
- Dashboard device health checks highlight reset, memory fragmentation, connectivity, and rendering problems and can export a diagnostic report.

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
