## AWTRIX NG 1.6.2

**Online update hotfix**

- The stable update checker reads firmware metadata and images from this repository's GitHub Pages deployment.
- Fixes “Unable to check GitHub Release” when the Web UI still pointed at the upstream project's Pages site.
- Fixes invalid JSON from `/api/v1/version` caused by quoting the HTTP ETag twice.
- GitHub Pages is now enabled for this repository and is populated from verified release assets by the Docs workflow.
- Existing configurations, scripts, applications, media, scenes and MQTT credentials are preserved.

---

## Which file should I use?

| Hardware | Web UI OTA update | First install over USB |
| --- | --- | --- |
| Original ESP32 / Ulanzi TC001 / AWTRIX 2 conversions | `firmware-awtrix-ng.bin` | The matching ESP32 image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with octal PSRAM (`N8R8`, `N16R8`) or no PSRAM | `firmware-awtrix-ng-s3-octal.bin` | The matching S3 octal image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with quad PSRAM (`N8R2`, `N16R2`, `N4R2`) | `firmware-awtrix-ng-s3-quad.bin` | The matching S3 quad image inside `usb-awtrix-ng.zip` |

For the ESP32-S3 N16R8 used to test this release, choose `firmware-awtrix-ng-s3-octal.bin` for an OTA update.
