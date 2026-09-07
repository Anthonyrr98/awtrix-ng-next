# Windows music visualizer

`tools/music_visualizer.py` captures the sound currently playing through Windows by using WASAPI
loopback, turns it into logarithmic FFT bands, and streams a 32×8 RGB spectrum to AWTRIX. Audio
never leaves the computer and the firmware does not decode it.

Install the two desktop-only dependencies:

```powershell
python -m pip install numpy soundcard
```

Start playback, then run:

```powershell
python tools/music_visualizer.py http://192.168.1.20
```

The visualizer selects its temporary pushed app and keeps it active while audio capture is running,
so normal app rotation does not replace the spectrum. Press `Ctrl+C` to stop, remove it, and return
to normal rotation.
Useful options:

```powershell
# Show Windows output devices. An asterisk marks the default.
python tools/music_visualizer.py --list-devices

# Choose an output, colour palette and frame rate.
python tools/music_visualizer.py http://192.168.1.20 --device "Speakers" --palette fire --fps 15

# A protected Web UI and a 64-pixel-wide chained panel.
python tools/music_visualizer.py http://192.168.1.20 --auth user:password --width 64
```

Palettes are `neon`, `fire`, `ocean`, and `mono`. The frame rate is limited to 5–30 FPS so this
tool cannot accidentally flood the device. Use `--gain` for quiet or loud sources and `--no-peak`
to remove the falling peak dots.

## Single-file Windows executable

Run the reproducible build script from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File tools/build_music_visualizer.ps1
```

The result is `dist/music-visualizer/awtrix-music-visualizer.exe`. It includes Python and all
runtime dependencies, so the destination computer does not need Python installed. Double-clicking
the executable opens an interactive prompt for the device address; command-line use is also supported:

```powershell
dist/music-visualizer/awtrix-music-visualizer.exe http://192.168.1.20
```

Windows may show a SmartScreen warning for an unsigned locally built executable. Code-sign the
file before broad distribution if the project has a signing certificate.
