# CLAUDE.md

Project repo for a USB-C PD powered 2-channel programmable bench supply: `boards/bench-psu`
(20 V PD in, two LMR51635 buck channels 1.6-16 V / 3 A, ESP32-S3 control, INA219 current/voltage
measurement, OLED + rotary encoder modules on headers; 4 layers). The VibePCB tooling (pipeline,
`fixes.py`, `check`, `fab`, tscircuit skill) is the sibling checkout `../VibePCB`: read its
`CLAUDE.md` and `docs/TOOLING.md` first. Commands run from here (`hatch run pcb all bench-psu`);
fix generic tool problems in `../VibePCB`, not here. Design rationale: header of
`boards/bench-psu/index.circuit.tsx` and `README.md`.
