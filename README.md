# vibepcb-bench-psu

USB-C PD (20 V) powered bench supply, 2 independent channels, 1.6-16.5 V / 3 A each, designed with
[VibePCB](../VibePCB). Board: `boards/bench-psu` (90 x 76 mm, 4 layers). Design rationale is also in the
header of `boards/bench-psu/index.circuit.tsx`.

```
USB-C PD (STUSB4500, 20 V) -> P-FET -> VIN
   VIN -> 5 V buck (LMR33630) -> 3.3 V LDO -> ESP32-S3-MINI-1 (I2C, PWM, BLE, native USB)
   VIN -> LMR33630 buck (x2) -> 20 mR shunt + INA226 -> output terminal (CH1, CH2)
ESP32 PWM -> RC filter -> op-amp/NPN current sink on the buck FB node = output voltage setpoint
INA226 ALERT -> buck EN = hardware over-current trip
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

- **Parts:** everything in JLCPCB stock (checked 2026-10-21 against JLCPCB's parts API); basic-library passives
  wherever the value exists; no through-hole parts except the screw terminal and the module headers.
- **Plain buck, not buck-boost:** the PD input (20 V) is always above the output (max 16.5 V).
- **Converter (rev B):** LMR33630A per channel (synchronous, 3 A, 400 kHz, HSOIC-8 with exposed pad, 36 V input),
  10 uH / 7.8 A (8.5 A sat) FXL1040 inductor, 4 x 22 uF/25 V ceramic output, 2 x 10 uF/50 V input.
- **Voltage setting, fail-safe:** an op-amp (TLV9062) + NPN sinks Ic = Vc / 2.4k from the feedback node,
  Vc = PWM (14-bit, 2-pole RC) * 10k/110k: Vout = 1.6 V + 4.55 * Vpwm, i.e. 1.6 V at 0 V / floating PWM or MCU reset,
  16.6 V at 3.3 V PWM (the hardware maximum), ~0.9 mV per step. Feedback is taken at the terminal, after the shunt.
  Firmware closes the loop on the INA226 bus-voltage reading.
- **Loop compensation:** that FB network has a feedback gain of 0.625 at every output voltage, but the LMR33630's
  internal compensation expects 1 V / Vout: simulated unstable at all outputs. 6.8k + 220 nF from FB to GND (lag
  network) lowers the gain above ~100 Hz: phase margin 52-75 deg, crossover 14-53 kHz, no conditional stability
  (see Simulations).
- **Enable / current trip:** ESP32 drives each buck's EN through 10k (100k pull-down: off at reset). The INA226 ALERT
  (shunt over-limit, latched) pulls EN low directly, so over-current switches the channel off in hardware within one
  conversion (~0.15-1 ms) without firmware involvement; the firmware sets the limit and clears the latch.
- **Measurement:** INA226 per channel (0x40 CH1, 0x41 CH2), 20 mR shunt: 4.096 A full scale, 125 uA / 1.25 mV LSB,
  60 mV drop and 0.18 W at 3 A.
- **Input:** STUSB4500 drives the AO4407A gate through 47k against 100k gate-source (Vgs stays inside +-25 V up to the
  TVS clamp), 100 nF gate-source for a slow turn-on. SMBJ22A TVS (35.5 V clamp, below the LMR33630's 38 V abs max),
  100 uF SMD electrolytic for damping.
- **Logic supply:** 5 V buck (same LMR33630, 15 uH) -> AP2112K 3.3 V; native USB on the ESP32 for flashing / CDC.
- **Antenna:** ESP32-S3-MINI-1 antenna end sits at the +y board edge; `vibepcb.toml` keeps GND pour out under it.

### Changed from rev A (and why)

| rev A | rev B | why |
|-------|-------|-----|
| LMR51635 (TSOT-23-6, 1.1 MHz) | LMR33630A (HSOIC-8 exposed pad, 400 kHz) | ~1.5 W loss at 3 A in a TSOT-23 package with no thermal pad; 1.6 V from 20 V below its minimum on-time at 1.1 MHz; extended part with ~2.4k stock |
| SWPA6045 10 uH, 2.45 A rated / 3.5 A sat | FXL1040 10 uH, 7.8 A / 8.5 A | rated below the 3 A output current, saturated below the converter's current limit |
| PWM injected into FB: 0 V PWM = 18.1 V | op-amp/NPN current sink: 0 V PWM = 1.6 V | a reset, a floating pin or a duty-0 firmware bug drove the output to 18 V, above the spec |
| FB before a 0.1 R shunt | FB after a 20 mR shunt | 0.3 V droop and 0.9 W in the shunt at 3 A |
| INA219, firmware-only current limit | INA226, ALERT wired to EN | hardware trip; 16-bit, 36 V bus |
| 100 uF / 63 V THT electrolytic on each output | ceramics only | a large output cap dumps into a short before any limit acts; THT assembly |
| 100 V ceramics on a 20 V rail | 50 V / 25 V basic-library parts | cost, availability (extended parts) |
| STUSB4500 pulls the gate straight to 0 V | 47k/100k divider + 100 nF | Vgs = -VBUS exceeded the +-25 V rating at the TVS clamp; no inrush control |
| SMBJ24A | SMBJ22A | 38.9 V clamp above the new converter's 38 V abs max |
| - | 6.8k + 220 nF lag network on FB | the fixed-gain FB network made the loop unstable (simulated) |

## Simulations (`boards/bench-psu/sim/`, details and tables in its [README](boards/bench-psu/sim/README.md))

ngspice decks for one channel, `ngspice -b boards/bench-psu/sim/<deck>.cir`:

- `buck_loadpoints.cir`: efficiency, losses, inductor peak/valley, ripple and Tj at 1.6 / 3.3 / 5 / 12 / 16 V x
  0.3 / 1 / 2 / 3 A. Efficiency 84-98 % at 1 A, 75-96 % at 3 A; 1.0-1.3 W in the IC at 3 A, so Tj is 68-79 C with
  thermal vias but 100-119 C without them (25 C ambient). Current limits hold at 3 A (thin valley margin at 1.6 V).
- `buck_loop.cir`: crossover / phase margin and 2 A load steps, with and without the lag network, and the lag
  values tried (`export_loop.py` re-runs it). Plots: `plots/*.png` (`plot.py`).

![load points](boards/bench-psu/sim/plots/loadpoints.png)
![loop](boards/bench-psu/sim/plots/loop_bode.png)

## Pin map (ESP32-S3)

| Pin | Net | Use |
|-----|-----|-----|
| IO8 / IO9 | I2C_SDA / I2C_SCL | STUSB4500, 2 x INA226, OLED (4.7k pull-ups) |
| IO10 | PD_ALERT | STUSB4500 alert (10k pull-up) |
| IO4 / IO5 | PWM1 / PWM2 | voltage setpoint CH1 / CH2 |
| IO6 / IO7 | EN1_MCU / EN2_MCU | channel enable (through 10k; INA226 ALERT overrides) |
| IO15 / IO16 / IO17 | ENC_A / ENC_B / ENC_SW | encoder (J4: CLK, DT, SW, VCC, GND) |
| IO19 / IO20 | USB_DN / USB_DP | native USB |
| IO0, EN | BOOT, EN_RST | tactile switches |

## Firmware duties (not part of this repo yet)

- Write the STUSB4500 NVM once over I2C so it requests 20 V (default NVM: 5 V only).
- Close the voltage loop on the INA226 bus-voltage reading (PWM -> Vout is ~4.55 V/V, offset +-80 mV before trim).
- Program each INA226's shunt over-limit (Mask/Enable SOL + LEN latch) to the set current limit; after a trip read
  Mask/Enable (clears the latch) and report it.
- Budget power: 2 x 16 V x 3 A = 96 W exceeds most PD sources (60 W at 20 V / 3 A); limit the sum of both
  channels to the negotiated PDO current.

## Status / open items

- Thermal vias in the LMR33630 exposed pads are not placed (vias in pads are not supported by the tooling yet):
  add them in KiCad before ordering, or expect the converters to run hot near 3 A.
- Loop stability is simulated with an averaged model whose internal-compensation constants are derived, not
  published: measure the load-step response on the first prototype (a channel at 1.6 V and at 16 V).
- No reverse-voltage / back-feed protection on the outputs (a battery on a switched-off channel back-feeds VIN
  through the high-side FET's body diode).
- Placement changed in rev B; re-run `check` after any move (routing changes with tiny placement changes).

## Build

`hatch run setup`, then `hatch run pcb all bench-psu` (build + fix + check; the routed build takes a few minutes).
Open `out/bench-psu/kicad/bench-psu.kicad_pro` in KiCad.
