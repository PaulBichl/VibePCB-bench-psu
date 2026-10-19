# vibepcb-bench-psu

USB-C PD (20 V) powered bench supply, 2 independent channels, 1.6-16 V / 3 A each, designed with
[VibePCB](../VibePCB).

```
USB-C PD (STUSB4500, 20 V) -> P-FET -> VIN
   VIN -> 5 V buck -> 3.3 V LDO -> ESP32-S3-MINI-1 (I2C, PWM, BLE, native USB)
   VIN -> LMR51635 buck (x2) -> 0.1 R shunt + INA219 -> output terminal (CH1, CH2)
ESP32 PWM -> RC filter -> buck feedback node = output voltage setpoint
header J3: SSD1306 OLED (I2C)   header J4: rotary encoder module (KY-040)
```

- Output voltage: 14-bit PWM injects current into the buck feedback node (about 1 mV per step),
  closed loop on the INA219 bus-voltage reading; firmware caps the setpoint at 16 V.
- Current limit: firmware switches the channel off above the limit (INA219, 3.2 A full scale).
- Plain buck, not buck-boost: PD input (20 V) is always above the output.
- STUSB4500 NVM must be written once (request 20 V) over I2C by the ESP32.
- Open risks: buck output-capacitor stability (ceramic derating at 16 V), unverified LCSC number of
  the 4-pin header (`pcb fab` checks availability).

Build: `hatch run setup`, then `hatch run pcb all bench-psu`.
