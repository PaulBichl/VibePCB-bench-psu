# CLAUDE.md

Project repo for a USB-C PD powered 2-channel programmable bench supply: `boards/bench-psu`
(rev C: 20 V PD in, two LMR33630 buck channels 1.6-16.6 V / 3 A with CV/CC, ESP32-S3 control, INA226 + INA181
per channel; the 90 x 60 mm 4-layer board is the front panel: OLED module, encoders, buttons on top, electronics on
the bottom). The VibePCB tooling (pipeline,
`fixes.py`, `check`, `fab`, tscircuit skill) is the sibling checkout `../VibePCB`: read its
`CLAUDE.md` and `docs/TOOLING.md` first. Commands run from here (`hatch run pcb all bench-psu`);
fix generic tool problems in `../VibePCB`, not here. Design rationale: header of
`boards/bench-psu/index.circuit.tsx` and `README.md`.
