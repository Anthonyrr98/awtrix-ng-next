## AWTRIX NG 1.4.3

**Simplified Chinese Web UI**

- The complete device Web UI is now available in Simplified Chinese alongside English and German.
- A Chinese browser selects Simplified Chinese on first use; manual language changes are remembered
  in that browser.
- Navigation, device health, scripts, apps, media, GPIO, MQTT, backup, maintenance and firmware
  update controls are translated.
- The document language follows the selected locale for accessibility and input-method support.
- Missing future translations fall back safely to English instead of exposing internal keys.

**Web UI maintenance**

- The former single-file JavaScript source is split into foundation, schema, shared-state and
  individual feature-page modules.
- Modules are still inlined at build time, so the device, simulator and provisioning portal keep
  one self-contained offline page with no extra requests or framework runtime.
- CI verifies module order, uniqueness and generated-content freshness.
- Berry API metadata and the built-in example catalog are generated into the Scripts source module
  before the final page is assembled.

**Compatibility**

- Existing settings, scripts, applications, MQTT credentials, scenes and stored media are preserved.
- HTTP, MQTT and Berry APIs are unchanged.
- Manual upload and verified online updates continue to use the same board-specific images.

---

**Which file do I need?**

| Your board | Update a running AWTRIX NG | First install over USB |
|---|---|---|
| Classic ESP32, Ulanzi TC001, AWTRIX 2 conversions | `firmware-awtrix-ng.bin` | An image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with octal PSRAM (`N8R8`, `N16R8`) or no PSRAM | `firmware-awtrix-ng-s3-octal.bin` | The matching S3 octal image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with quad PSRAM (`N8R2`, `N16R2`, `N4R2`) | `firmware-awtrix-ng-s3-quad.bin` | The matching S3 quad image inside `usb-awtrix-ng.zip` |

For the ESP32-S3 N16R8 used to test this release, choose
`firmware-awtrix-ng-s3-octal.bin` for an OTA update.
