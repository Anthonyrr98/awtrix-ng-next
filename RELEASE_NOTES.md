## AWTRIX NG 1.6.0

**Trusted and identifiable firmware updates**

- Stable update manifests now publish an Ed25519 detached signature, generated and verified by release CI for downstream clients and independent provenance checks.
- SHA-256 image verification, board-variant checks and post-boot rollback validation remain in place as separate safety layers.
- The version endpoint now reports the source build ID, reproducible commit timestamp and embedded Web UI ETag, making local and release builds unambiguous.
- Release CI warns once a firmware consumes 88% of its OTA slot and refuses builds at 90%.

**Interface performance and reliability**

- Application reordering moves existing cards instead of rebuilding the complete grid during every pointer crossing, and uses compositor-friendly positioning for the drag preview.
- Liquid Glass avoids expensive blur work while dragging and automatically reduces transparency effects on constrained browsers and for accessibility preferences.
- Fixed Liquid Glass hiding the script editor's syntax-highlighted source behind its transparent input layer.

**Long-running device validation**

- Added a reusable soak sampler for recording device health as JSON Lines and enforcing minimum internal-heap, contiguous-block and connectivity thresholds during 24–72 hour tests.
- Existing configurations, scripts, applications, media, scenes and MQTT credentials are preserved.
- HTTP, MQTT and Berry application APIs remain compatible; `/api/v1/version` only gains additive fields.

---

## Which file should I use?

| Hardware | Web UI OTA update | First install over USB |
| --- | --- | --- |
| Original ESP32 / Ulanzi TC001 / AWTRIX 2 conversions | `firmware-awtrix-ng.bin` | The matching ESP32 image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with octal PSRAM (`N8R8`, `N16R8`) or no PSRAM | `firmware-awtrix-ng-s3-octal.bin` | The matching S3 octal image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with quad PSRAM (`N8R2`, `N16R2`, `N4R2`) | `firmware-awtrix-ng-s3-quad.bin` | The matching S3 quad image inside `usb-awtrix-ng.zip` |

For the ESP32-S3 N16R8 used to test this release, choose `firmware-awtrix-ng-s3-octal.bin` for an OTA update.
