# vibepcb-bench-psu

USB-C PD (20 V) powered bench supply, 2 independent channels, 1.6-16 V / 3 A each, designed with
[VibePCB](../VibePCB). Board: `boards/bench-psu` (90 x 76 mm, 4 layers). Design rationale is also in the
header of `boards/bench-psu/index.circuit.tsx`.

```
USB-C PD (STUSB4500, 20 V) -> P-FET -> VIN
   VIN -> 5 V buck -> 3.3 V LDO -> ESP32-S3-MINI-1 (I2C, PWM, BLE, native USB)
   VIN -> LMR51635 buck (x2) -> 0.1 R shunt + INA219 -> output terminal (CH1, CH2)
ESP32 PWM -> RC filter -> buck feedback node = output voltage setpoint
header J3: SSD1306 OLED (I2C)   header J4: rotary encoder module (KY-040)
```

## Look at it (`boards/bench-psu/hardware/`)

| What | File |
|------|------|
| Schematic | [bench-psu-schematic.pdf](boards/bench-psu/hardware/bench-psu-schematic.pdf) |
| Top view (3D) | [bench-psu-top.png](boards/bench-psu/hardware/bench-psu-top.png) |
| Bottom view (3D) | [bench-psu-bottom.png](boards/bench-psu/hardware/bench-psu-bottom.png) |
| Layout | [front](boards/bench-psu/hardware/bench-psu-layout-front.svg), [back](boards/bench-psu/hardware/bench-psu-layout-back.svg), [PDF](boards/bench-psu/hardware/bench-psu-layout.pdf) |
| KiCad project (open the `.kicad_pro`) | [kicad/](boards/bench-psu/hardware/kicad/) |
| BOM (JLCPCB format, LCSC + MPN) | [bench-psu-bom.csv](boards/bench-psu/hardware/bench-psu-bom.csv) |
| Gerbers + drill | [fab/bench-psu-gerbers.zip](boards/bench-psu/hardware/fab/bench-psu-gerbers.zip) |
| Pick-and-place (CPL) | [fab/bench-psu-cpl.csv](boards/bench-psu/hardware/fab/bench-psu-cpl.csv) |

![top](boards/bench-psu/hardware/bench-psu-top.png)
![bottom](boards/bench-psu/hardware/bench-psu-bottom.png)

## Design decisions

- **Plain buck, not buck-boost:** the PD input (20 V) is always above the output (max 16 V). The only
  I2C-programmable buck-boost considered (TPS55288) is not in JLCPCB's catalogue.
- **Voltage setting:** per channel a 14-bit ESP32 PWM, RC filtered (2 x 10k/1uF), injects current into the
  LMR51635 feedback node: Vout = 0.8 V * (1 + 100k/6k) - 5 * (Vpwm - 0.8 V), i.e. 18.1 V at 0 V PWM, 1.6 V at
  3.3 V PWM, about 1 mV per PWM step. Firmware closes the loop on the INA219 bus-voltage reading and caps
  the setpoint at 16 V.
- **Enable:** ESP32 drives each buck's EN pin (100k pull-down: outputs off at reset).
- **Measurement / current limit:** INA219 per channel (0x40 CH1, 0x41 CH2) on a 0.1 R high-side shunt
  (3.2 A full scale); firmware switches the channel off above the set limit (the buck's own limit is 3.5 A peak).
- **Logic supply:** 5 V buck (LMR51635) -> AP2112K 3.3 V; native USB on the ESP32 for flashing / CDC.
- **Antenna:** ESP32-S3-MINI-1 antenna end sits at the +y board edge; `vibepcb.toml` keeps GND pour out under it.

## Pin map (ESP32-S3)

| Pin | Net | Use |
|-----|-----|-----|
| IO8 / IO9 | I2C_SDA / I2C_SCL | STUSB4500, 2 x INA219, OLED (4.7k pull-ups) |
| IO10 | PD_ALERT | STUSB4500 alert (10k pull-up) |
| IO4 / IO5 | PWM1 / PWM2 | voltage setpoint CH1 / CH2 |
| IO6 / IO7 | EN1 / EN2 | channel enable |
| IO15 / IO16 / IO17 | ENC_A / ENC_B / ENC_SW | encoder (J4: CLK, DT, SW, VCC, GND) |
| IO19 / IO20 | USB_DN / USB_DP | native USB |
| IO0, EN | BOOT, EN_RST | tactile switches |

## Firmware duties (not part of this repo yet)

- Write the STUSB4500 NVM once over I2C so it requests 20 V.
- Close the voltage loop on the INA219 bus-voltage reading; cap the setpoint at 16 V.
- Switch a channel off above its current limit.

## Status / open items

- `hatch run pcb check bench-psu` passes (0 errors, warnings only); `pcb fab` has been run (files above). It prints "may not have availability" for most parts, including common ones: the parts engine is not a reliable stock check, so verify stock in JLCPCB's BOM upload before ordering.
- Buck output stability at 16 V is unverified (3 x 4.7 uF/100 V ceramic, heavily derated at 16 V, plus 100 uF
  electrolytic): simulate or test on the first prototype.
- LCSC number of the 4-pin header (C492403) is unverified.
- `check` still warns about unlabelled connector pins (J1, J2) and has ERC/DRC symbol-library and unconnected-pin
  warnings (unused ESP32 pins).
- Placement was tuned by nudging parts (J1, Q1, INA219 positions) until the router left no sharp bends; routing
  changes with tiny placement changes, so re-run `check` after any move.

## Build

`hatch run setup`, then `hatch run pcb all bench-psu` (build + fix + check; the routed build takes a few minutes).
Open `out/bench-psu/kicad/bench-psu.kicad_pro` in KiCad.
