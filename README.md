# vibepcb-bench-psu

USB-C PD (20 V) powered bench supply, 2 independent channels, 1.6-16.5 V / 3 A each, constant voltage / constant
current, designed with [VibePCB](../VibePCB). Board: `boards/bench-psu` (rev C: 90 x 60 mm, 4 layers, parts on both
sides). Design rationale is also in the header of `boards/bench-psu/index.circuit.tsx`.

The board is the front panel: the top carries what a user touches (0.96" OLED module, per channel an encoder and an
ON/OFF button, ON / CC LEDs, the output terminal), the bottom carries all electronics.

```
USB-C PD (STUSB4500, 20 V) -> P-FET -> VIN
   VIN -> 5 V buck (LMR33630) -> 3.3 V LDO -> ESP32-S3-MINI-1 (I2C, PWM, PCNT, ADC, BLE, native USB)
   VIN -> LMR33630 buck (x2) -> 20 mR shunt (INA226 + INA181) -> output terminal (CH1, CH2)
ESP32 PWM -> RC -> op-amp/NPN current sink on FB            = voltage set point (CV)
ESP32 PWM -> RC -> differential PI integrator -> diode -> FB = current limit (CC), vs INA181 (1 V/A)
INA226 ALERT -> buck EN = hardware over-current trip (backstop)
per channel: EC11 encoder (turn: set, push: V <-> I), ON/OFF button, ON LED (= EN), CC LED (GPIO),
             output discharge (2N7002 + 1k while off), SS54 reverse diode, NTC on the converter
J3: SSD1306 0.96" I2C OLED module
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

- **Parts:** everything in JLCPCB stock (checked 2026-10-22 against JLCPCB's parts search); basic-library passives
  wherever the value exists. Two-sided assembly: all SMD on the bottom except the status LEDs and their drivers;
  the front-panel parts (encoders, buttons, OLED header, terminal) are through-hole and hand-soldered.
- **Form factor (rev C):** 90 x 60 mm (rev B 90 x 76): the front-panel parts are through-hole, so their pins also take
  room on the bottom; 90 mm is what the two channel blocks, the control columns and the ESP32 need side by side.
  4 x M3 holes at (+-41.5, +-26.5) mm from the centre, keepouts for screw heads in `vibepcb.toml`.
- **Plain buck, not buck-boost:** the PD input (20 V) is always above the output (max 16.5 V).
- **Converter:** LMR33630A per channel (synchronous, 3 A, 400 kHz, HSOIC-8 with exposed pad, 36 V input),
  15 uH / 7 A sat FXL1040-150 inductor (TI's L_MIN is 11.6 uH at 16.6 V / 400 kHz; rev B's 10 uH was below it above
  ~14 V), 4 x 22 uF/25 V ceramic output, 2 x 10 uF/50 V input.
  **Thermal vias** (2 x 3, 0.3 mm, `[thermal_vias.*]`) in every LMR33630 exposed pad; the pad connects solid to the
  pours.
- **Voltage setting, fail-safe:** an op-amp (TLV9062) + NPN sinks Ic = Vc / 2.2k from the feedback node,
  Vc = PWM (14-bit, 2-pole RC) * 10k/120k (R106 + R107 + R108): Vout = 1.6 V + 4.55 * Vpwm, i.e. 1.6 V at 0 V / floating PWM or MCU reset,
  16.6 V at 3.3 V PWM (the hardware maximum), ~0.9 mV per step. Feedback is taken at the terminal, after the shunt.
  Firmware closes the loop on the INA226 bus-voltage reading.
- **Loop compensation:** the FB network has a feedback gain of 0.625 at every output voltage, but the LMR33630's
  internal compensation expects 1 V / Vout: unstable without help. 6.8k + 220 nF from FB to GND (lag network) lowers
  the gain above ~100 Hz: phase margin 52-75 deg, crossover 14-53 kHz.
- **Start-up (rev C fix):** during the converter's soft start the lag capacitor charges through the 120k top resistor;
  rev B overshot to ~7.7 V at *every* enable (simulated, `sim/powerup_ch.cir`). Rev C pre-charges it to ~1.3 V while
  the channel is off (1N4148W + 100k from the discharge-gate node); with EN high the diode blocks: no offset.
  Overshoot now 0.02 %.
- **Constant current (rev C):** INA181A2 (x50) on the shunt = 1 V/A; ISET = PWM, 2-pole RC, 1 V/A; a TLV9062 half as a
  differential PI integrator (10k, 330 R + 100 nF in both legs) sources current into FB through 10k + 1N4148W when
  I > Iset. Differential, because the plant gain into a short is ~240: a plain non-inverting PI keeps a
  high-frequency gain >= 1 and oscillates. Simulated phase margin >= 90 deg from a short to 5 R, a 20 R -> 2 R step
  settles in 3.6 ms (`sim/cc_loop.cir`). In CV the amp rests at 0 V, the diode is off.
- **Enable / current trip:** ESP32 drives each buck's EN through 10k (100k pull-down: off at reset). The INA226 ALERT
  (shunt over-limit, latched) pulls EN low directly: the hard backstop, at a ceiling the firmware sets above Iset.
- **Output:** 100 nF at the terminal (INA226 VBUS); SS54 reverse diode (a reversed source is clamped); active
  discharge while off (2N7002 + 4.7k, gate from 5 V, held off by an NPN while EN is high): "off" is 0 V within ~1.2 s
  (rev B: 28 s decay through the divider), also at reset and after a trip.
- **Cooling: passive.** ~1.6 W per channel at 3 A (1.0-1.3 W in the IC). With the thermal vias Tj stays below 99 C at
  45 C ambient (35 C room + 10 K in a vented enclosure; 139 C without vias, `sim/buck_loadpoints.cir`). A 10k NTC
  (Murata NCP18XH103F03RB) next to each converter feeds ESP32 ADC1 (IO1 / IO2) for firmware derating; the converter's
  thermal shutdown is the last resort. No fan.
- **Measurement:** INA226 per channel (0x40 CH1, 0x41 CH2), 20 mR shunt: 4.096 A full scale, 125 uA / 1.25 mV LSB,
  60 mV drop and 0.18 W at 3 A.
- **Input protection (rev C, from the review):** ESDA25P35 TVS on VBUS at the connector (ahead of Q1: the STUSB4500's
  VDD is rated 28 V), ESDA25W ESD array on CC1 / CC2 as in ST's reference; D+/D- through the USBLC6.
- **Input:** STUSB4500 drives the AO4407A gate through 47k against 100k gate-source (Vgs stays inside +-25 V up to the
  TVS clamp), 100 nF gate-source for a slow turn-on. SMBJ22A TVS (35.5 V clamp, below the LMR33630's 38 V abs max),
  100 uF SMD electrolytic for damping.
- **Logic supply:** 5 V buck (same LMR33630, 6.8 uH / 4 A sat FXL0530: rev B's 15 uH saturated at 1.65 A, below the
  converter's 2.9 A current limit; 4 x 22 uF output, two of them on the top side) -> AP2112K 3.3 V; native USB on the ESP32 for flashing / CDC.
- **Front panel:** EC11E15244B2 encoders (counted by the S3's PCNT units), Omron B3F-4055 12 mm buttons (wired on
  diagonal pads 1 / 4: always across the contact), 10k pull-up + 10 nF on every front-panel line. 0.96" SSD1306
  I2C module (0x3C) on J3, its content is firmware.
- **Status LEDs:** ON (yellow-green) follows the converter's EN node through an NPN (hardware truth, dark after an
  INA226 trip); CC (red) is a GPIO (IO21 / IO47) the firmware lights while the channel is current-limited.
- **Antenna:** the ESP32-S3-MINI-1 (bottom) points its antenna at the +x board edge; no copper under it on any layer.

### Changed from rev B (and why)

| rev B | rev C | why |
|-------|-------|-----|
| 90 x 76 mm, everything on top | 90 x 60 mm, front panel on top, electronics on the bottom | the board is the front panel; smaller |
| OLED + KY-040 encoder as modules on headers | OLED module on J3, per channel EC11 encoder + ON/OFF button on the board | per-channel controls |
| current trip only (INA226 ALERT -> EN) | CC loop (INA181 + differential PI into FB) + the trip as backstop | a real current limit instead of switching off |
| lag capacitor starts discharged | pre-charged while off (1N4148W + 100k) | 7.7 V overshoot at every enable (simulated) |
| output decays over ~28 s when off | 2N7002 + 1k discharge while EN is low | "off" means 0 V |
| no reverse protection | SS54 across each output | reversed source / battery clamped |
| no thermal vias (tool limitation) | 2 x 3 via grid in each exposed pad (`thermal_vias`) | Tj 139 C -> 99 C at 45 C ambient, 3 A |
| no temperature sensing | NTC per converter on ADC1 | firmware derating with passive cooling |
| no mounting holes | 4 x M3 | enclosure |
| sim decks run by hand | 5 decks run by `check`, pass ranges with sources | verification is enforced |
| 2.4k sink resistor: Vout_max 15.2 V | 2.2k: 16.6 V | the reviewer agent found R106 in series with the VSET divider |
| 10 uH channel / 15 uH (1.65 A sat) logic inductors | 15 uH / 7 A sat, 6.8 uH / 4 A sat | below TI's L_MIN; saturating below the current limit (review) |
| no TVS / ESD at the USB-C input | ESDA25P35 on VBUS, ESDA25W on CC | hot-plug transients reached the STUSB4500 unclamped (review) |

### Changed from rev A (and why)

| rev A | rev B | why |
|-------|-------|-----|
| LMR51635 (TSOT-23-6, 1.1 MHz) | LMR33630A (HSOIC-8 exposed pad, 400 kHz) | ~1.5 W loss at 3 A in a TSOT-23 package with no thermal pad; 1.6 V from 20 V below its minimum on-time at 1.1 MHz |
| SWPA6045 10 uH, 2.45 A rated / 3.5 A sat | FXL1040 10 uH, 7.8 A / 8.5 A | rated below the 3 A output current, saturated below the converter's current limit |
| PWM injected into FB: 0 V PWM = 18.1 V | op-amp/NPN current sink: 0 V PWM = 1.6 V | a reset, a floating pin or a duty-0 firmware bug drove the output to 18 V |
| FB before a 0.1 R shunt | FB after a 20 mR shunt | 0.3 V droop and 0.9 W in the shunt at 3 A |
| INA219, firmware-only current limit | INA226, ALERT wired to EN | hardware trip; 16-bit, 36 V bus |
| 100 uF / 63 V THT electrolytic on each output | ceramics only | a large output cap dumps into a short before any limit acts |
| STUSB4500 pulls the gate straight to 0 V | 47k/100k divider + 100 nF | Vgs exceeded +-25 V at the TVS clamp; no inrush control |
| SMBJ24A | SMBJ22A | 38.9 V clamp above the converter's 38 V abs max |
| - | 6.8k + 220 nF lag network on FB | the fixed-gain FB network made the loop unstable (simulated) |

## Simulations (`boards/bench-psu/sim/`, run by `hatch run pcb check`)

Each deck declares what it proves (`* covers:`) and its pass ranges with their source (`* range:`, datasheet /
intent / house defaults); `check` runs ngspice, compares the deck's R/C values with the board and judges the results.

| Deck | Covers | Result |
|------|--------|--------|
| `buck_loop.cir` | CV loop U11 / U21 | phase margin >= 52 deg (1.6-16 V), 2 A step <= 371 mV (intent: 400 mV) |
| `cc_loop.cir` | CC loop | phase margin >= 90 deg (short .. 5 R), settles in 3.6 ms, current error < 0.01 % |
| `powerup_ch.cir` | power-up U11 / U21 | overshoot 0.02 % (rev B network: 384 %), settles in 2.2 ms after the set-point ramp |
| `powerup_logic.cir` | power-up U3 / U4 | V5 5.15-5.17 V, V3V3 3.28-3.31 V through a 0.1 -> 0.35 A step |
| `buck_loadpoints.cir` | thermal U11 / U21 | Tj <= 99 C at 45 C ambient, inductor peak <= 3.49 A (ISC min 3.85 A) |

Models: averaged peak-current-mode buck with the LMR33630's internal compensation *derived* (not published), COMP
clamp, PFM (no reverse current); switching-level power stage for the load points. Plots / full load-point table:
[sim/README.md](boards/bench-psu/sim/README.md) (rev B numbers, 25 C ambient).

## Design review (reviewer agent)

`hatch run pcb review bench-psu --run`: a fresh Claude session checks every part against its datasheet (178 checklist
items; answers and citations in `boards/bench-psu/review.toml`). First run: 155 ok, 15 issues, 8 unknown. Fixed:
Vout_max (15.2 V -> 16.6 V), both inductor choices, the 5 V output capacitance, the discharge resistor's power, the
missing VBUS TVS / CC ESD. Accepted with reasons in `findings.toml`: connector current (= the 3 A PD contract), OLED
module pin order, LED polarity (tscircuit's anode = pin 1), the LDO's thermals (0.4 A is a short peak), Q1 gate drive
at 5 V (bring-up only), and the loop constants (measured on the prototype).

## Pin map (ESP32-S3)

| Pin | Net | Use |
|-----|-----|-----|
| IO8 / IO9 | I2C_SDA / I2C_SCL | STUSB4500 0x28, INA226 0x40 / 0x41, OLED 0x3C (4.7k pull-ups) |
| IO10 | PD_ALERT | STUSB4500 alert (10k pull-up) |
| IO4 / IO5 | PWM1 / PWM2 | voltage set point CH1 / CH2 |
| IO11 / IO12 | ISET1 / ISET2 | current limit CH1 / CH2 (1 V/A after the RC) |
| IO6 / IO7 | EN1_MCU / EN2_MCU | channel enable (through 10k; INA226 ALERT overrides) |
| IO1 / IO2 | NTC1 / NTC2 | converter temperature (ADC1; 10k to 3V3, NTC to GND) |
| IO15 / IO16 / IO17 | ENC1_A / ENC1_B / ENC1_SW | CH1 encoder |
| IO13 / IO14 / IO18 | ENC2_A / ENC2_B / ENC2_SW | CH2 encoder |
| IO38 / IO39 | BTN1 / BTN2 | ON/OFF buttons (low = pressed) |
| IO21 / IO47 | LED_CC1 / LED_CC2 | red CC LED CH1 / CH2 (high = on) |
| IO19 / IO20 | USB_DN / USB_DP | native USB |
| IO0, EN | BOOT, EN_RST | tactile switches (bottom) |

`hatch run pcb fab bench-psu` also writes `bench-psu-pins.h` (net -> pin defines) for the firmware.

## Firmware duties (not part of this repo yet)

- Write the STUSB4500 NVM once over I2C so it requests 20 V (default NVM: 5 V only).
- **Enable sequence:** PWM (VSET) = 0 before EN high, wait ~5 ms for the soft start, then ramp the set point (>= 5 ms).
  Enabling at a high set point starts at the converter's current limit with no soft start (`sim/powerup_ch.cir`).
- Close the voltage loop on the INA226 bus-voltage reading (PWM -> Vout is ~4.55 V/V, offset trimmed per channel).
- Current limit: ISET PWM = Iset * 1 V/A; light the CC LED while the INA226 current is within ~2 % of Iset.
  Program each INA226's shunt over-limit (Mask/Enable SOL + LEN latch) to a ceiling above Iset (e.g. Iset + 0.5 A,
  max 3.5 A); after a trip read Mask/Enable (clears the latch) and report it.
- Temperature: NTC (B 3380) -> derate the current limit above ~85 C board temperature, switch off above ~100 C.
- Budget power: the sum of both channels stays inside the negotiated PDO (60 W at 20 V / 3 A).
- UI: encoders via PCNT, push toggles V / I editing; ON/OFF buttons toggle EN; the OLED shows set and measured V / I,
  CV / CC and temperature per channel.

## Bring-up

Bring the board up from the bottom: logic first from a plain 5 V source, then the channels at 5 V input, and 20 V
only after that. The STUSB4500's factory NVM asks for 5 V only, so any USB-C port or charger gives VIN = 5 V until
step 4. Use a PC port or a USB-C supply you can current-limit; keep a DMM, a scope and a power resistor (a few ohms,
10 W) at hand. `hatch run pcb fab bench-psu` also writes a generated bring-up sheet (`bench-psu-bringup.md`).

Test points (bottom, labelled): TP1 VBUS, TP2 VIN, TP3 V5, TP4 3V3, TP5 GND. Outputs at the terminal (top).

### 0. Unpowered

1. Look: D1 (TVS), C6 (electrolytic), D13 / D23 (SS54) polarity, the LEDs the right way round, no solder bridges on
   U5 (ESP32), U12 / U22 (INA226, 0.65 mm pitch), U6 / U7. Thermal vias visible in the LMR33630 pads.
2. Resistance to GND (meter on 2 kOhm+ range, capacitors charge): VBUS, VIN, 5V, 3V3 not shorted; OUT1 / OUT2
   > 100 kOhm (the discharge FET needs its 5 V gate drive, so it is off while unpowered).

### 1. Logic at 5 V

1. Plug a plain USB-C 5 V source (current limit ~300 mA). Idle draw should be well under 100 mA.
2. Measure TP2 VIN ~5 V, TP3 ~4.6 V (buck in dropout), TP4 = 3.3 V. Both ON LEDs dark, both CC LEDs dark.
3. Nothing gets warm.

### 2. Firmware, I2C, front panel

1. Hold BOOT, tap RST, release BOOT (bottom side): the ESP32-S3 enumerates as "USB JTAG/serial debug unit" on the same
   USB-C connector. Flash a test firmware.
2. I2C scan: 0x28 STUSB4500, 0x40 / 0x41 INA226, 0x3C OLED (module on J3). INA226 die ID (0xFF) = 0x2260.
3. Encoders count on IO15/16 and IO13/14, pushes on IO17 / IO18, buttons on IO38 / IO39; CC LEDs on IO21 / IO47.
4. NTC readings (IO1 / IO2) ~1.65 V at 25 C.

### 3. Channels at 5 V input

Each channel alone, no load first. Output range at 5 V input is 1.6 V to ~4.3 V (buck dropout).

1. PWM = 0, ISET = 3.3 V (no current limit), then EN high: ON LED lights, OUTn = 1.6 V, no overshoot on the scope.
2. Step the PWM: Vout = 1.6 V + 4.55 * Vpwm. Note offset / gain per channel for the calibration.
3. EN low: ON LED dark, the output falls to 0 V within ~1.2 s (discharge).
4. CC: set 3 V, ISET = 0.5 V (0.5 A), load 2 Ohm: the output drops to ~1 V, the current reads 0.5 A (INA226 and DMM).
5. Trip: INA226 over-limit 0.3 A with ISET above it: ON LED dark at once, EN = 0 V; reading Mask/Enable clears it.

### 4. 20 V

1. Write the STUSB4500 NVM for a 20 V PDO (with 5 V / 9 V fallback; check the readback), unplug, plug a 20 V PD
   charger (45 W+). VIN = 20 V within ~1 s; 5V = 5.17 V.
2. Per channel, no load: 1.6 V at PWM 0; ramp to ~16.6 V (hardware maximum; firmware caps at 16.5 V).
3. Load steps with the scope on the terminal: 1 -> 3 A at 1.6 V and at 16 V: <= ~0.4 V deviation, recovers within
   1 ms (sim). Ringing that does not settle means less phase margin than simulated: report it.
4. CC into a short (thick wire) at Iset 1 A and 3 A: the current settles at Iset within a few ms.
5. Heat: 3 A at 5 V and 12 V for 10 minutes, in the enclosure if there is one: NTC reading and a thermocouple on the
   LMR33630 case should stay below ~85 C.

## Status / open items

- Loop and CC stability are simulated with an averaged model whose internal-compensation constants are derived, not
  published: measure the load-step and short-circuit responses on the first prototype.
- Back-feed: a source *above* the set voltage on a channel (e.g. a battery) back-feeds VIN through the high-side FET's
  body diode, and an off channel discharges it through 1k. Do not connect batteries / active loads.
- The current loop needs ~2 ms after a step into the limit (integrator rising from 0 V); meanwhile the converter runs
  at its own ~4.5 A peak limit. The INA226 trip is the fast backstop.

## Build

`hatch run setup`, then `hatch run pcb all bench-psu` (build + fix + check; the routed build takes 10+ minutes, run it
in the background). Open `out/bench-psu/kicad/bench-psu.kicad_pro` in KiCad.
