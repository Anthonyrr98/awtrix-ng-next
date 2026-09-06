# AWTRIX NG example apps

This directory contains 16 ready-to-install Berry apps for the on-device script runtime.

| App | Purpose |
|---|---|
| `bilibili_fans` | Bilibili follower counter |
| `matrix_rain` | Configurable digital rain |
| `looking_eyes` | Animated eyes |
| `fireworks` | Fireworks with density and brightness controls |
| `color_waves` | Rainbow colour waves |
| `radar` | Rotating radar sweep |
| `pacifica` | Calm ocean animation |
| `twinkling_stars` | Stars with density and brightness controls |
| `snake_visual` | Animated snake pattern |
| `binary_clock` | Binary clock |
| `dice` | Animated dice |
| `plasma_clock` | Clock over a plasma background |
| `pomodoro` | Pomodoro timer |
| `game_of_life` | Conway's Game of Life |
| `moon_phase` | Current moon phase |
| `light_chart` | Ambient-light history chart |

Open **Scripts → Example library** in the device Web UI to browse, preview, and install any of
these apps with one click. Existing scripts with the same name are never overwritten. Configuration
fields declared at the top of each script then appear under **Apps → Actions → Configure**.

The library is generated from `apps/*.ax` during every firmware build, so this directory remains
the single source of truth. Advanced users can still copy or modify the source manually.
