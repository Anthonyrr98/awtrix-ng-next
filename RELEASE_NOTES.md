## AWTRIX NG 1.3.1

**Fixed**

- MQTT over TLS now connects using the broker hostname instead of its resolved IP address, preserving SNI and certificate hostname verification.
- HiveMQ Cloud connections on port `8883` no longer fail repeatedly with `Not connected · Refused` after DNS resolution succeeds.

**Compatibility**

- Existing MQTT settings and credentials are preserved; no migration is required.
- Plain MQTT connections and non-TLS brokers are unchanged.

---

**Which file do I need?**

| Your board | Update a running AWTRIX NG | First install over USB |
|---|---|---|
| Classic ESP32, Ulanzi TC001, AWTRIX 2 conversions | `firmware-awtrix-ng.bin` | An image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with octal PSRAM (`N8R8`, `N16R8`) or no PSRAM | `firmware-awtrix-ng-s3-octal.bin` | The matching S3 octal image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with quad PSRAM (`N8R2`, `N16R2`, `N4R2`) | `firmware-awtrix-ng-s3-quad.bin` | The matching S3 quad image inside `usb-awtrix-ng.zip` |

For the ESP32-S3 N16R8 used to test this release, choose `firmware-awtrix-ng-s3-octal.bin` for an OTA update.
