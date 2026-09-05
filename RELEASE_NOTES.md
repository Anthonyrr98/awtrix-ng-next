## AWTRIX NG 1.3.0

**Added**

- Certificate-verified MQTT over TLS for secure cloud brokers.
- A **TLS encryption** switch in System → MQTT. HiveMQ Cloud users can enable it with port `8883`.
- Built-in trust for the long-lived Let's Encrypt ISRG Root X1 certificate; TLS never falls back to an unverified connection.

**Compatibility**

- Existing MQTT configurations remain unchanged because TLS defaults to off.
- Settings, apps, scripts, radio stations and backup archives from 1.2.x remain compatible.

---

**Which file do I need?**

| Your board | Update a running AWTRIX NG | First install over USB |
|---|---|---|
| Classic ESP32, Ulanzi TC001, AWTRIX 2 conversions | `firmware-awtrix-ng.bin` | An image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with octal PSRAM (`N8R8`, `N16R8`) or no PSRAM | `firmware-awtrix-ng-s3-octal.bin` | The matching S3 octal image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with quad PSRAM (`N8R2`, `N16R2`, `N4R2`) | `firmware-awtrix-ng-s3-quad.bin` | The matching S3 quad image inside `usb-awtrix-ng.zip` |

For the ESP32-S3 N16R8 used to test this release, choose `firmware-awtrix-ng-s3-octal.bin` for an OTA update.
