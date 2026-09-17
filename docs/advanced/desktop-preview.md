# Windows desktop preview

`awtrix-desktop-preview.exe` mirrors the current AWTRIX NG matrix in a small
native Windows window. It talks directly to the device and does not use or keep
a web browser open.

## Start it

1. Download `awtrix-desktop-preview.exe` from the latest GitHub release.
2. Run it and enter the device address, for example `http://192.168.1.20`.
3. Move the window by dragging the display. Resize it from any edge or corner.

The address, window position, size, and always-on-top preference are saved for
the next launch. A red dot in the upper-left corner means the device cannot be
reached; the tray tooltip contains the connection error.

You can also supply the address on the command line:

```powershell
awtrix-desktop-preview.exe http://192.168.1.20
```

## Tray controls

Right-click the AWTRIX NG icon in the Windows notification area to:

- show or hide the preview window;
- enable or disable **Always on top**;
- change the device address;
- choose a 10, 20, or 30 FPS refresh rate;
- enable **Start with Windows**;
- exit the background process.

Closing the preview window hides it to the notification area. Choose **Exit**
from the tray menu to stop it completely. Double-clicking the tray icon toggles
the window.

## Privacy and network use

The companion only requests `GET /api/v1/display/screen` from the configured
AWTRIX NG device. The default is 20 FPS; 10 FPS reduces network and CPU use,
while 30 FPS makes fast animations smoother. Requests never overlap, so a slow
or disconnected device cannot create a growing request queue. It has no cloud service, analytics,
browser engine, or bundled runtime. The executable is a small native .NET
Framework application and Windows 10/11 already includes the required runtime.

If Web UI authentication is enabled, this initial version cannot connect yet.
Disable authentication on a trusted local network or wait for credential support
in a future release.

## Build from source

Run this on Windows:

```powershell
./tools/build_desktop_preview.ps1
```

The output is `dist/desktop-preview/awtrix-desktop-preview.exe`.
