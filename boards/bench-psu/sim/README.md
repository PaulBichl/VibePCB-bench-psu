# bench-psu simulations (rev C)

`hatch run pcb check bench-psu` runs every deck here with ngspice, compares the deck's R/C values with the board and
judges each `.measure` against the deck's `* range:` lines (datasheet / intent / house limits). By hand:
`ngspice -b boards/bench-psu/sim/<deck>.cir` from the repo root. Model assumptions are in each deck's header.

Channel: VIN 20 V (PD), LMR33630A at 400 kHz, 15 uH FXL1040-150, 4 x 22 uF/25 V 1206 (DC-bias derated) + 100 uF
electrolytic at the terminal (C25 / C26), 20 mOhm shunt, regulation at the terminal.

| Deck | Covers | Result (rev C) |
|------|--------|----------------|
| `buck_loop.cir` | CV loop U11 / U21 | phase margin 93-98 deg at crossover (1.6-16 V), 2 A step <= 251 mV (intent 400 mV) |
| `cc_loop.cir` | CC loop | phase margin >= 91 deg (short .. 5 R), settles in 1.7 ms, current error < 0.01 % |
| `powerup_ch.cir` | power-up U11 / U21 | overshoot 0.02 %, settles 13.5 ms after EN, 16.60 V at full PWM, FB <= 3.8 V after a set-point drop (clamp D16) |
| `powerup_logic.cir` | power-up U3 / U4 | V5 5.15-5.17 V, V3V3 3.28-3.30 V through a 0.1 -> 0.35 A step |
| `buck_loadpoints.cir` | thermal U11 / U21 | Tj <= 112 C at 45 C ambient (max Rds(on)), inductor peak <= 3.41 A (ISC min 3.85 A) |

## Control loop: `buck_loop.cir` (plots from `export_loop.py` + `plot.py`)

![loop](plots/loop_bode.png)
![load step](plots/loop_loadstep.png)
![lag network variants](plots/loop_lagsweep.png)

Averaged peak-current-mode model; the LMR33630's internal compensation is not published. The constant
(gm * Rc / Ri = 120 A/V) is derived from the datasheet's CFF equation, so treat the absolute numbers as indicative.
Load step: 1 A -> 3 A -> 1 A, 2 us edges. "Lowest phase" is phase + 180 deg anywhere below the crossover: below 0 the
loop is conditionally stable (stable only while the loop gain stays high, e.g. not after current limit or soft start).

| Vout | FB network | Crossover | Phase margin | Lowest phase below fc | Undershoot / overshoot (2 A step) |
|-----:|------------|----------:|-------------:|----------------------:|----------------------------------:|
| 1.6 V | divider only | 120 kHz | **-1 deg** | - | oscillates |
| 16 V | divider only | 227 kHz | **-70 deg** | - | oscillates |
| 1.6 V | + 6.8k / 220 nF lag (board) | 9 kHz | 94 deg | 35 deg | 193 / 202 mV |
| 3.3 V | + lag | 12 kHz | 96 deg | 31 deg | 202 / 211 mV |
| 5 V | + lag | 15 kHz | 98 deg | 26 deg | 206 / 215 mV |
| 12 V | + lag | 29 kHz | 97 deg | **9 deg** | 224 / 233 mV |
| 16 V | + lag | 38 kHz | 93 deg | **2 deg** | 242 / 251 mV |

Why the lag network: the fail-safe voltage setting (Vout = 1.6 V + 120k x Isink) gives a feedback gain of 0.625 at
every output voltage, while the internal compensation expects 1 V / Vout. R111/C113 (R211/C213) from FB to GND lower
the gain to 0.054 above ~100 Hz and leave DC regulation as it is.

Open point: with the rev C output bulk (C25 / C26) the lowest phase below crossover is only 9 deg at 12 V and 2 deg
at 16 V (rev B, ceramics only: ~35 deg). Still above 0, so not conditionally stable, but with little room; the deck
judges phase margin at crossover only. Measure the loop on the prototype (README bring-up 4.3) before trusting it.

## Load points: `buck_loadpoints.cir`

Switching-level power stage at 3 A, Rds(on) at the datasheet maximum (HS 160 / LS 110 mOhm), inductor DCR +20 %,
switching / dead-time / gate losses added analytically, core loss not modelled. Tj = 45 C + P_IC x RthJA.

| Vout | Efficiency | P_loss | P_IC | iL peak / valley | Ripple at terminal | Tj (43 / 75 C/W) |
|-----:|-----------:|-------:|-----:|-----------------:|-------------------:|-----------------:|
| 1.6 V | 71 % | 1.95 W | 1.24 W | 3.16 / 2.84 A | 1.4 mVpp | 98 / 138 C |
| 5 V | 88 % | 2.06 W | 1.32 W | 3.33 / 2.67 A | 4.7 mVpp | 102 / 144 C |
| 10 V | 93 % | 2.24 W | 1.44 W | 3.41 / 2.59 A | 10.7 mVpp | 107 / 153 C |
| 16 V | 95 % | 2.46 W | 1.57 W | 3.22 / 2.77 A | 7.8 mVpp | 112 / 162 C |

43 C/W is TI's JEDEC figure with thermal vias (the board has a 2 x 3 grid per pad); 75 C/W an estimate without them.
TI marks RthJA as a comparison figure, so the NTCs (TH11 / TH21) let the firmware derate if the bench says otherwise.

## Files

- `*.cir`: the decks (assumptions in their headers).
- `export_loop.py`: runs `buck_loop.cir` for every output voltage / FB network / lag variant -> `results/*.csv`.
- `plot.py`: `results/` -> `plots/*.png` (`uv run --no-project --with matplotlib python boards/bench-psu/sim/plot.py`).
