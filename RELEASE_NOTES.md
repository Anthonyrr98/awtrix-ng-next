## AWTRIX NG 1.5.0

**Global themes and Liquid Glass**

- Added a global theme registry with a public API for registering, applying, enumerating and observing themes without coupling feature pages to a specific palette.
- Added a theme picker to the header with persistent Dark, Light, White Liquid Glass and Color Liquid Glass choices, localized in English, German and Simplified Chinese.
- Liquid Glass themes provide translucent surfaces, high-saturation background blur, refractive borders, accessible focus states, reduced-motion handling and clearer component separation.
- Theme changes propagate to the embedded icon editor and future registered themes appear in the picker automatically.

**Application management**

- Reworked the application rotation into compact square cards so substantially more apps fit on screen at once.
- Dragging now carries a full-size card under the pointer while preserving a visible source slot.
- Application action menus rise above neighbouring cards instead of being clipped or obscured.
- Improved visual boundaries for application cards, settings sections, audio panels, navigation and form rows in both Liquid Glass themes.

**Language and maintenance improvements**

- The language button now opens an extensible picker containing every registered language.
- Stable update checks use the project-hosted release manifest and firmware endpoints, avoiding browser CORS restrictions on GitHub Release asset downloads.
- Documentation deployment now publishes the verified OTA manifest and board-specific firmware files consumed by the device updater.
- The Scripts toolbar keeps the full Example Library label visible instead of clipping it into an icon-sized button.

**Compatibility**

- Existing device settings, scripts, applications, MQTT credentials, scenes and stored media are preserved.
- HTTP, MQTT and Berry APIs are unchanged.
- Theme preferences are browser-local; an obsolete preview theme name safely falls back to the browser's preferred light or dark mode.
- Liquid Glass blur and colour mixing require a current browser. Older browsers retain functional controls and layout with reduced visual effects.

---

**Which file do I need?**

| Your board | Update a running AWTRIX NG | First install over USB |
|---|---|---|
| Classic ESP32, Ulanzi TC001, AWTRIX 2 conversions | `firmware-awtrix-ng.bin` | An image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with octal PSRAM (`N8R8`, `N16R8`) or no PSRAM | `firmware-awtrix-ng-s3-octal.bin` | The matching S3 octal image inside `usb-awtrix-ng.zip` |
| ESP32-S3 with quad PSRAM (`N8R2`, `N16R2`, `N4R2`) | `firmware-awtrix-ng-s3-quad.bin` | The matching S3 quad image inside `usb-awtrix-ng.zip` |

For the ESP32-S3 N16R8 used to test this release, choose `firmware-awtrix-ng-s3-octal.bin` for an OTA update.
