# AWTRIX NG Next — Device Setup

This repository is configured for the following tested hardware setup.

## Controller

- SoC: ESP32-S3
- Flash: 16 MB
- PSRAM: 8 MB octal
- Firmware environment: `awtrix_s3_octal`
- AWTRIX NG version at setup: 1.1.0

## LED matrix

- Type: WS2812-compatible
- Size: 32 x 8 (256 pixels)
- Data GPIO: 21
- Panel count: 1
- Panel start: `topLeft`
- Panel wiring: `columns`
- Serpentine: enabled
- Chain reverse: disabled
- Chain serpentine: disabled
- Mirror: disabled
- Rotate: disabled

## Default peripheral GPIOs

| Peripheral | GPIO |
| --- | ---: |
| Left button | 11 |
| Select button | 12 |
| Right button | 13 |
| Battery ADC | 1 |
| LDR ADC | 2 |
| Passive buzzer | 7 |
| I2C SDA | 8 |
| I2C SCL | 9 |
| DFPlayer RX | 17 |
| DFPlayer TX | 18 |
| I2S BCLK | 5 |
| I2S LRCLK/WS | 6 |
| I2S DOUT | 4 |

Unused peripherals should be set to `-1` in the AWTRIX GPIO configuration.

## Power and signal wiring

- Power the matrix directly from a regulated 5 V supply rated for at least 3–4 A.
- Join the power-supply ground, matrix ground, and ESP32-S3 ground.
- Do not route matrix current through the ESP32-S3 board.
- Put a 330–470 ohm resistor in series between GPIO 21 and matrix DIN.
- Put a 1000 uF capacitor across 5 V and GND at the matrix input.

## Brownout test modification

`src/main.cpp` disables the ESP32-S3 brownout detector at the beginning of
`setup()`. This was added for bench testing after an undersized supply caused
repeated `BROWNOUT_RST` resets. It does not correct an inadequate supply and
removes a hardware protection mechanism. Re-enable brownout protection for
normal use after the power supply has been corrected.

