// VibePCB bench-psu rev C: USB-C PD powered 2-channel programmable bench supply, 1.6..16.5 V / 3 A per channel, CV/CC.
// 90 x 60 mm, 4 layers. The board is the front panel: TOP = user side (0.96" SSD1306 OLED module on J3, per channel an
// EC11 encoder (turn: set, push: V <-> I limit) and a 12 mm ON/OFF button, ON / CC LEDs, output terminal, 4 x M3 holes);
// BOTTOM = all electronics (two-sided JLCPCB assembly; the top carries only the LEDs and their drivers as SMD, the THT
// front parts are hand-soldered). USB-C at the top edge (bottom side), ESP32 antenna at the right edge.
// Build with: hatch run pcb all bench-psu
//
// Architecture (design decisions; rev B rationale in README "Changed from rev A")
// - Parts: all in JLCPCB stock (checked 2026-10-22 against JLCPCB's parts search); basic-library passives wherever a
//   value exists.
// - Input: USB-C PD sink (STUSB4500, NVM requests 20 V; written once by the ESP32 over I2C, see README) -> P-FET -> VIN.
//   The STUSB4500 pulls the gate through 47k against the 100k gate-source resistor: Vgs = -0.68 * VBUS (-13.6 V at 20 V,
//   -24 V at the SMBJ22A clamp voltage), inside the AO4407A's +-25 V; 100 nF gate-source slows the turn-on (~3 ms).
//   SMBJ22A (35.5 V clamp) stays below the LMR33630's 38 V absolute maximum.
// - Converter: one LMR33630A (400 kHz, HSOIC-8 + exposed pad with a 2 x 3 thermal via grid, vibepcb.toml) per channel,
//   15 uH / 7 A sat FXL1040-150 (TI L_MIN 11.6 uH at 16.6 V), 4 x 22 uF output + 100 uF electrolytic
//   at the terminal (C25 / C26: ceramics derate to ~18 uF at 16 V, the loop gain does not change with Vout), 220 nF
//   50 V HF input cap. Input never below output (PD 20 V, output <= 16.5 V): a buck is enough.
// - Voltage set, fail-safe: Vout = 1 V * (1 + 120k/200k) + 120k * Ic, Ic sunk from FB by an op-amp + NPN current sink,
//   Ic = Vc / 2.2k, Vc = PWM (2-pole RC) * 10k/120k (R106 + R107 + R108; rev B's 2.4k reached only 15.2 V). PWM 0 V / floating / ESP32 in reset -> 1.6 V; 3.3 V -> 16.6 V (the
//   hardware maximum). Loop: 6.8k + 220 nF lag network FB-GND (sim/buck_loop.cir: phase margin 52..75 deg).
//   The lag capacitor is pre-charged (~1.1 V via 1N4148W + 100k from the discharge gate node) while the channel is
//   off: otherwise the soft start charges it through the 120k top resistor and every start overshoots to ~7.7 V
//   (rev B; sim/powerup_ch.cir). With EN high the diode blocks: no offset in operation.
// - Current limit, CV/CC (new in rev C): INA181A2 (x50) on the 20 mOhm shunt = 1 V/A. A TLV9062 PI error amp compares it
//   with ISET (PWM, 2-pole RC, 1 V/A) in a differential PI integrator (10k, 330 + 100 nF in both legs: high-frequency
//   gain 0.033, stable into a short) and, when I > Iset, sources current into FB through 10k + 1N4148W: the converter
//   lowers Vout until I = Iset (constant current). In CV the amp sits at 0 V and the diode is off. The INA226 ALERT ->
//   EN trip stays as a fast backstop at a ceiling the firmware sets above Iset. sim/cc_loop.cir: CC loop stability.
// - Output: 100 nF at the terminal (INA226 VBUS), SS54 reverse diode (a reversed source / battery is clamped), and an
//   active discharge (2N7002 + 4.7k, gate from 5 V, held off by an NPN while EN is high): "off" is below 0.5 V within ~2 s
//   (C25 / C26 100 uF + ceramics through 4.7k) instead of a ~60 s decay through the feedback divider; also at reset and after a trip.
// - Temperature: 10k NTC next to each LMR33630 into ESP32 ADC1 (IO1 / IO2): firmware derates / switches off (passive
//   cooling, ~1.6 W per channel at 3 A; the converter's own thermal shutdown is the last resort).
// - Measure: INA226 per channel (0x40 / 0x41): 4.096 A full scale, 125 uA / 1.25 mV LSB.
// - Status LEDs per channel: ON follows the converter's EN node (hardware truth, dark after a trip), CC is a GPIO.
// - Control: ESP32-S3-MINI-1, native USB on the USB-C port (flashing / CDC; BOOT + RST on the back), BLE.
//   Encoders counted by the S3's PCNT units; 10k pull-ups + 10 nF on every front-panel line.
import {
  A_1N4148W, A_2N7002, AO4407A, AP2112K_3_3TRG1, B3F_4055, DG301_5_0_04P_14_1000A_H_, EC11E15244B2, ESDA25P35_1U1M, ESDA25W,
  ESP32_S3_MINI_1_N8, FXL0530_6R8_M, FXL1040_150_M, INA181A2IDBVR, INA226AIDGSR, LMR33630ADDAR, MMBT3904_RANGE_100_300_ as NPN,
  RVT1V101M0607_100UF_35V as ELCAP, SMBJ22A, SS54, STUSB4500QTR, TLV9062IDR, TS_1187A_B_A_B,
  TYPE_C_16PIN_2MD_073_, USBLC6_2SC6,
} from "./imports"
import { C, R, RSENSE, TRACE_MAX, net } from "./parts"

const PWR = "0.8mm" // output path
const VIN_W = "1.2mm" // VIN: up to 3 A from the input stage to both channels
const MID = "0.4mm" // 5 V, 3.3 V, switch-node-adjacent

const at = (x: number, y: number) => ({ pcbX: x, pcbY: y })
const B = { layer: "bottom" as const }
const bot = (x: number, y: number) => ({ ...at(x, y), ...B })

/** NTC 10k B3380 0603 (Murata NCP18XH103F03RB) */
const NTC = ({ name, ...p }: { name: string; pcbX: number; pcbY: number; layer: "bottom" }) => (
  <resistor name={name} resistance="10k" footprint="0603" manufacturerPartNumber="NCP18XH103F03RB"
    supplierPartNumbers={{ jlcpcb: ["C13564"] }} {...p} />
)

/** One output channel n (1 or 2), bottom side, block origin (ox, oy): buck + FB current sink + CC loop + shunt +
 *  INA226 / INA181 + output discharge + NTC. Op-amp halves: U6 (voltage set sink), U7 (CC error amp). */
const Channel = ({ n, ox, oy }: { n: 1 | 2; ox: number; oy: number }) => {
  const p = (x: number, y: number) => bot(ox + x, oy + y)
  const id = (s: string, i: number) => `${s}${n}${String(i).padStart(2, "0")}`
  const c = (i: number) => `.${id("C", i)}`
  const r = (i: number) => `.${id("R", i)}`
  const U = `.U${n}1`
  const L = `.L${n}1`
  const INA = `.U${n}2`
  const CS = `.U${n}3`
  const Q = `.Q${n}1`
  const AB = n === 1 ? "A" : "B"
  const sink = { out: `.U6 > .OUT${AB}`, neg: `.U6 > .IN${AB}_NEG`, pos: `.U6 > .IN${AB}_POS` }
  const cc = { out: `.U7 > .OUT${AB}`, neg: `.U7 > .IN${AB}_NEG`, pos: `.U7 > .IN${AB}_POS` }
  return (
    <>
      {/* power row */}
      <LMR33630ADDAR name={`U${n}1`} {...p(0, 0)} />
      <C name={id("C", 1)} {...p(-5.5, 1.5)} pcbRotation={90} v="10uF 50V" />
      <C name={id("C", 2)} {...p(-7.8, 1.5)} pcbRotation={90} v="10uF 50V" />
      <C name={id("C", 3)} {...p(-5, -2.5)} pcbRotation={90} v="220nF 50V" />
      <C name={id("C", 4)} {...p(3.5, 4)} v="100nF" />
      <C name={id("C", 5)} {...p(4.4, -2.5)} pcbRotation={90} v="1uF" />
      <FXL1040_150_M name={`L${n}1`} {...p(12, 0)} />
      <C name={id("C", 6)} {...p(20.5, 2.6)} pcbRotation={90} v="22uF 25V" />
      <C name={id("C", 7)} {...p(23, 2.6)} pcbRotation={90} v="22uF 25V" />
      <C name={id("C", 8)} {...p(20.5, -2.6)} pcbRotation={90} v="22uF 25V" />
      <C name={id("C", 9)} {...p(23, -2.6)} pcbRotation={90} v="22uF 25V" />
      <RSENSE name={id("R", 1)} {...p(28, 0)} pcbRotation={90} v="20m" />
      <SS54 name={`D${n}3`} {...p(32.5, 3.2)} pcbRotation={90} />
      <C name={id("C", 14)} {...p(32.5, -2.5)} pcbRotation={90} v="100nF" />
      {/* NTC on the converter, divider to 3.3 V */}
      <NTC name={`TH${n}1`} {...p(-2.7, 4.6)} />
      <R name={id("R", 24)} {...p(0.4, 5.6)} v="10k" />
      <C name={id("C", 20)} {...p(3.6, 5.9)} v="100nF" />
      {/* row A: feedback network, current sink, current sense */}
      <R name={id("R", 2)} {...p(-0.5, -5)} v="120k" />
      <R name={id("R", 3)} {...p(2.7, -5)} v="200k" />
      <R name={id("R", 11)} {...p(-0.5, -7.5)} v="6.8k" />
      <C name={id("C", 13)} {...p(2.7, -7.5)} v="220nF" />
      <NPN name={`Q${n}1`} {...p(6.5, -7.5)} />
      <R name={id("R", 4)} {...p(10.3, -7.5)} v="2.2k" />
      <R name={id("R", 25)} {...p(13.8, -7.5)} v="330" />
      <R name={id("R", 15)} {...p(17.5, -7.5)} v="10k" />
      <C name={id("C", 16)} {...p(20.5, -7.5)} v="100nF" />
      <INA181A2IDBVR name={`U${n}3`} {...p(24.5, -7.5)} />
      <INA226AIDGSR name={`U${n}2`} {...p(30, -8.5)} />
      <C name={id("C", 12)} {...p(32.7, -8)} pcbRotation={90} v="100nF" />
      {/* EN: ESP32 through 10k, 100k pull-down, INA226 ALERT (open drain) overrides */}
      <R name={id("R", 9)} {...p(-4.5, -6)} v="100k" />
      <R name={id("R", 10)} {...p(-7.5, -6)} v="10k" />
      {/* row B: CC injection, voltage set RC */}
      <R name={id("R", 16)} {...p(-3.5, -10.5)} v="10k" />
      <A_1N4148W name={`D${n}4`} {...p(0.7, -10.5)} />
      <R name={id("R", 5)} {...p(4.8, -10.5)} v="1k" />
      <R name={id("R", 6)} {...p(8.5, -10.5)} v="10k" />
      <C name={id("C", 10)} {...p(11.5, -10.5)} v="1uF" />
      <R name={id("R", 7)} {...p(14.5, -10.5)} v="100k" />
      <R name={id("R", 8)} {...p(17.5, -10.5)} v="10k" />
      <C name={id("C", 11)} {...p(20.5, -10.5)} v="1uF" />
      <C name={id("C", 15)} {...p(24.5, -10.5)} v="100nF" />
      {/* row C: current set RC, CC error amp passives, output discharge */}
      <R name={id("R", 19)} {...p(-6.5, -13.5)} v="10k" />
      <C name={id("C", 18)} {...p(-3.5, -13.5)} v="1uF" />
      <R name={id("R", 20)} {...p(-0.5, -13.5)} v="100k" />
      <C name={id("C", 19)} {...p(2.5, -13.5)} v="100nF" />
      <R name={id("R", 17)} {...p(5.5, -13.5)} v="10k" />
      <R name={id("R", 18)} {...p(8.5, -13.5)} v="330" />
      <C name={id("C", 17)} {...p(11.5, -13.5)} v="100nF" />
      <A_2N7002 name={`Q${n}3`} {...p(15.2, -13.5)} />
      <R name={id("R", 21)} {...p(18.5, -13.5)} v="4.7k" />
      <NPN name={`Q${n}4`} {...p(22.2, -13.5)} />
      <R name={id("R", 22)} {...p(25.5, -13.5)} v="47k" />
      <R name={id("R", 23)} {...p(28.5, -13.5)} v="47k" />
      {/* row D: lag-capacitor pre-charge while the channel is off (sim/powerup_ch.cir: 7.7 V start overshoot without) */}
      <A_1N4148W name={`D${n}5`} {...p(22, -16.6)} />
      <R name={id("R", 26)} {...p(26.5, -16.6)} v="100k" />

      {net("VIN", [`${U} > .VIN`, `${c(1)} > .pin1`, `${c(2)} > .pin1`, `${c(3)} > .pin1`], { thickness: VIN_W })}
      {net("GND", [`${U} > .PGND`, `${U} > .EP`, `${c(1)} > .pin2`, `${c(2)} > .pin2`, `${c(3)} > .pin2`, `${c(5)} > .pin2`,
        `${c(6)} > .pin2`, `${c(7)} > .pin2`, `${c(8)} > .pin2`, `${c(9)} > .pin2`, `${c(10)} > .pin2`, `${c(11)} > .pin2`,
        `${c(12)} > .pin2`, `${c(13)} > .pin2`, `${c(14)} > .pin2`, `${c(15)} > .pin2`, `${r(25)} > .pin2`, `${c(18)} > .pin2`,
        `${c(19)} > .pin2`, `${c(20)} > .pin2`, `${r(3)} > .pin2`, `${r(4)} > .pin2`, `${r(8)} > .pin2`, `${r(9)} > .pin2`,
        `${INA} > .GND`, `${INA} > .A1`, `${CS} > .GND`, `${CS} > .REF`, `.D${n}3 > .anode`, `.Q${n}3 > .S`, `.Q${n}4 > .E`,
        `.TH${n}1 > .pin2`])}
      {net(`SW_CH${n}`, [`${U} > .SW`, `${L} > .pin1`, `${c(4)} > .pin2`], { thickness: PWR })}
      <trace from={`${U} > .BOOT`} to={`${c(4)} > .pin1`} maxLength={TRACE_MAX} />
      <trace from={`${U} > .VCC`} to={`${c(5)} > .pin1`} maxLength={TRACE_MAX} />
      {net(`OUT${n}_B`, [`${L} > .pin2`, `${c(6)} > .pin1`, `${c(7)} > .pin1`, `${c(8)} > .pin1`, `${c(9)} > .pin1`,
        `${r(1)} > .pin1`, `${INA} > .VIN_POS`, `${CS} > .IN_POS`], { thickness: PWR })}
      {net(`OUT${n}`, [`${r(1)} > .pin2`, `${INA} > .VIN_NEG`, `${INA} > .VBUS`, `${r(2)} > .pin1`, `${CS} > .IN_NEG`,
        `${c(14)} > .pin1`, `.D${n}3 > .cathode`, `${r(21)} > .pin2`], { thickness: PWR })}
      {net(`FB${n}`, [`${U} > .FB`, `${r(2)} > .pin2`, `${r(3)} > .pin1`, `${r(11)} > .pin1`, `${Q} > .C`, `.D${n}4 > .cathode`])}
      {net(`LAG${n}`, [`${r(11)} > .pin2`, `${c(13)} > .pin1`, `${r(26)} > .pin2`])}
      <trace from={`.D${n}5 > .cathode`} to={`${r(26)} > .pin1`} maxLength={TRACE_MAX} />
      {net(`ISINK${n}_E`, [`${Q} > .E`, `${r(4)} > .pin1`, sink.neg])}
      <trace from={`${Q} > .B`} to={`${r(5)} > .pin2`} maxLength={TRACE_MAX} />
      {net(`ISINK${n}_DRV`, [`${r(5)} > .pin1`, sink.out])}
      {net(`PWM${n}`, [`${r(6)} > .pin1`])}
      {net(`PWM${n}_F`, [`${r(6)} > .pin2`, `${c(10)} > .pin1`, `${r(7)} > .pin1`])}
      {net(`VSET${n}`, [`${r(7)} > .pin2`, `${r(8)} > .pin1`, `${c(11)} > .pin1`, sink.pos])}
      {/* CC loop: ISENS (1 V/A) vs ISET, differential PI integrator (10k; 330 + 100 nF on both inputs), 10k + diode into FB */}
      {net(`ISENS${n}`, [`${CS} > .OUT`, `${r(15)} > .pin1`])}
      {net(`ISENS${n}_F`, [`${r(15)} > .pin2`, `${c(16)} > .pin1`, cc.pos])}
      <trace from={`${c(16)} > .pin2`} to={`${r(25)} > .pin1`} maxLength={TRACE_MAX} />
      {net(`ISET${n}`, [`${r(19)} > .pin1`])}
      {net(`ISET${n}_A`, [`${r(19)} > .pin2`, `${c(18)} > .pin1`, `${r(20)} > .pin1`])}
      {net(`ISET${n}_F`, [`${r(20)} > .pin2`, `${c(19)} > .pin1`, `${r(17)} > .pin1`])}
      {net(`CC${n}_NEG`, [`${r(17)} > .pin2`, `${c(17)} > .pin1`, cc.neg])}
      <trace from={`${c(17)} > .pin2`} to={`${r(18)} > .pin1`} maxLength={TRACE_MAX} />
      {net(`CC${n}_OUT`, [cc.out, `${r(18)} > .pin2`, `${r(16)} > .pin1`])}
      <trace from={`${r(16)} > .pin2`} to={`.D${n}4 > .anode`} maxLength={TRACE_MAX} />
      {/* enable + discharge */}
      {net(`EN${n}`, [`${U} > .EN`, `${r(9)} > .pin1`, `${r(10)} > .pin2`, `${INA} > .Alert`, `${r(22)} > .pin1`])}
      {net(`EN${n}_MCU`, [`${r(10)} > .pin1`])}
      <trace from={`.Q${n}4 > .B`} to={`${r(22)} > .pin2`} maxLength={TRACE_MAX} />
      {net(`DIS${n}_G`, [`.Q${n}4 > .C`, `.Q${n}3 > .G`, `${r(23)} > .pin1`, `.D${n}5 > .anode`])}
      <trace from={`.Q${n}3 > .D`} to={`${r(21)} > .pin1`} maxLength={TRACE_MAX} />
      {net("V5", [`${r(23)} > .pin2`])}
      {/* supplies, bus, temperature */}
      {net("V3V3", [`${INA} > .VS_POS`, `${c(12)} > .pin1`, `${CS} > .VS`, `${c(15)} > .pin1`, `${r(24)} > .pin1`])}
      {net("I2C_SCL", [`${INA} > .SCL`])}
      {net("I2C_SDA", [`${INA} > .SDA`])}
      {net(n === 1 ? "GND" : "V3V3", [`${INA} > .A0`])}
      {net(`NTC${n}`, [`${r(24)} > .pin2`, `.TH${n}1 > .pin1`, `${c(20)} > .pin1`])}
    </>
  )
}

/** Front-panel column of channel n at x = cx (TOP: encoder, ON/OFF button, ON / CC LEDs; BOTTOM: their RC). */
const Controls = ({ n, cx, ccGpio }: { n: 1 | 2; cx: number; ccGpio: string }) => {
  const id = (s: string, i: number) => `${s}${n}${String(i).padStart(2, "0")}`
  const ye = 16 // encoder centre
  const yb = -17 // button centre
  const yl = -7 // LEDs
  const ENC = `.ENC${n}`
  const BTN = `.SW${n}3`
  const lines = [`ENC${n}_A`, `ENC${n}_B`, `ENC${n}_SW`, `BTN${n}`]
  // pull-up / filter pairs on the bottom, inside the encoder's pin ring and between the button's pads
  const rc = [[cx - 1.5, ye - 3], [cx - 1.5, ye], [cx - 1.5, ye + 3], [cx, yb]] as const
  return (
    <>
      <EC11E15244B2 name={`ENC${n}`} {...at(cx, ye)} />
      <B3F_4055 name={`SW${n}3`} {...at(cx, yb)} />
      {lines.map((line, i) => (
        <>
          <R key={`r${line}`} name={id("R", 30 + i)} {...bot(rc[i][0], rc[i][1] + (i === 3 ? 0.9 : 0))} v="10k" />
          <C key={`c${line}`} name={id("C", 30 + i)} {...bot(rc[i][0] + 3, rc[i][1] - (i === 3 ? 0.9 : 0))} v="10nF" />
          {net("V3V3", [`.${id("R", 30 + i)} > .pin1`])}
          {net(line, [`.${id("R", 30 + i)} > .pin2`, `.${id("C", 30 + i)} > .pin1`])}
          {net("GND", [`.${id("C", 30 + i)} > .pin2`])}
        </>
      ))}
      {net(`ENC${n}_A`, [`${ENC} > .A`])}
      {net(`ENC${n}_B`, [`${ENC} > .B`])}
      {net(`ENC${n}_SW`, [`${ENC} > .E`])}
      {net("GND", [`${ENC} > .C`, `${ENC} > .D`, `${ENC} > .pin6`, `${ENC} > .pin7`, `${BTN} > .pin4`])}
      {/* B3F: pins 1-2 and 3-4 pairs per datasheet are not guessed - diagonal pads 1 / 4 are always across the switch */}
      {net(`BTN${n}`, [`${BTN} > .pin1`])}

      {/* status LEDs (top): ON = hardware EN state through an NPN, CC = GPIO */}
      <led name={id("D", 1)} color="green" footprint="0603" manufacturerPartNumber="KT-0603YG"
        supplierPartNumbers={{ jlcpcb: ["C2289"] }} {...at(cx - 3, yl)} />
      <led name={id("D", 2)} color="red" footprint="0603" manufacturerPartNumber="KT-0603R"
        supplierPartNumbers={{ jlcpcb: ["C2286"] }} {...at(cx + 3, yl)} />
      <R name={id("R", 12)} {...at(cx - 3, yl + 3)} v="1k" />
      <R name={id("R", 13)} {...at(cx + 3, yl + 3)} v="1k" />
      <NPN name={`Q${n}2`} {...at(cx - 3, yl + 6.5)} />
      <R name={id("R", 14)} {...at(cx + 1.5, yl + 6.5)} v="47k" />
      {net("V3V3", [`.${id("R", 12)} > .pin1`])}
      <trace from={`.${id("R", 12)} > .pin2`} to={`.${id("D", 1)} > .anode`} maxLength={TRACE_MAX} />
      <trace from={`.${id("D", 1)} > .cathode`} to={`.Q${n}2 > .C`} maxLength={TRACE_MAX} />
      <trace from={`.Q${n}2 > .B`} to={`.${id("R", 14)} > .pin2`} maxLength={TRACE_MAX} />
      {net(`EN${n}`, [`.${id("R", 14)} > .pin1`])}
      {net(`LED_CC${n}`, [`.${id("R", 13)} > .pin1`, `.U5 > .${ccGpio}`])}
      <trace from={`.${id("R", 13)} > .pin2`} to={`.${id("D", 2)} > .anode`} maxLength={TRACE_MAX} />
      {net("GND", [`.Q${n}2 > .E`, `.${id("D", 2)} > .cathode`])}

      <silkscreentext text={`CH${n}`} {...at(cx, 25.5)} fontSize="1.5mm" />
      <silkscreentext text="SET V - push: I" {...at(cx, 4.6)} fontSize="0.9mm" />
      <silkscreentext text="ON" {...at(cx - 3, yl - 1.6)} fontSize="0.8mm" />
      <silkscreentext text="CC" {...at(cx + 3, yl - 1.6)} fontSize="0.8mm" />
      <silkscreentext text="ON / OFF" {...at(cx, yb - 5)} fontSize="1mm" />
    </>
  )
}

const CH1X = 7
const CH2X = 33

export default () => (
  <board
    width="90mm"
    height="60mm"
    layers={4}
    doubleSidedAssembly
    minTraceWidth="0.15mm"
    minTraceToPadEdgeClearance="0.1mm"
    minBoardEdgeClearance="0.5mm"
    minViaHoleDiameter="0.3mm"
    minViaPadDiameter="0.5mm"
    minViaEdgeToPadEdgeClearance="0.2mm"
    autorouterEffortLevel="10x"
    schematicDisabled
  >
    {/* ============================ USB-C PD input (bottom) ============================ */}
    <TYPE_C_16PIN_2MD_073_ name="J1" {...bot(20, 24.8)} pcbRotation={180} />
      <USBLC6_2SC6 name="U2" {...bot(20, 19.5)} />
      <R name="R2" {...bot(16.3, 19.5)} pcbRotation={90} v="1M" />
      <C name="C5" {...bot(23.7, 19.5)} pcbRotation={90} v="4.7nF" />
      <STUSB4500QTR name="U1" {...bot(20, 14.5)} />
      <C name="C1" {...bot(16.5, 16.3)} pcbRotation={90} v="1uF" />
      {/* VREG caps east of U1, pad 1 facing their pins (bottom side mirrors: 180 deg = pad 1 at -x): the router
          detoured VREG_2V7 under U1 past the VBUS pad when the caps stood vertical */}
      <C name="C2" {...bot(24.2, 15.4)} pcbRotation={180} v="1uF" />
      <C name="C3" {...bot(24.2, 13.75)} pcbRotation={180} v="1uF" />
      <C name="C4" {...bot(16.5, 12.9)} pcbRotation={90} v="100nF" />
      <R name="R1" {...bot(20, 10.8)} v="1k" />
    {net("VBUS", [".J1 > .VBUS1", ".J1 > .VBUS2", ".U1 > .VDD", ".C1 > .pin1", ".C4 > .pin1", ".R1 > .pin1"], { thickness: PWR })}
    {net("GND", [".J1 > .GND1", ".J1 > .GND2", ".U1 > .GND", ".U1 > .EP", ".U1 > .VSYS", ".U1 > .RESET",
      ".U1 > .ADDR0", ".U1 > .ADDR1", ".C1 > .pin2", ".C2 > .pin2", ".C3 > .pin2", ".C4 > .pin2", ".R2 > .pin2",
      ".C5 > .pin2", ".U2 > .GND"])}
    {net("USB_SHIELD", [".J1 > .EH1", ".J1 > .EH2", ".J1 > .EH3", ".J1 > .EH4", ".R2 > .pin1", ".C5 > .pin1"])}
    {/* hot-plug protection at the connector (top side, review J1:protection): VBUS TVS ahead of Q1 (U1 VDD 28 V abs max),
        CC1 / CC2 ESD array as in ST's STUSB4500 reference */}
    <ESDA25P35_1U1M name="D2" {...at(17, 21.5)} />
    <ESDA25W name="U8" {...at(22.3, 20.6)} />
    {net("VBUS", [".D2 > .pin1"], { thickness: PWR })}
    {net("GND", [".D2 > .pin2", ".U8 > .A"])}
    {net("CC1", [".J1 > .CC1", ".U1 > .CC1", ".U1 > .CC1DB", ".U8 > .K1"])}
    {net("CC2", [".J1 > .CC2", ".U1 > .CC2", ".U1 > .CC2DB", ".U8 > .K2"])}
    {net("USB_DP", [".J1 > .Dp1", ".J1 > .Dp2", ".U2 > .pin3", ".U2 > .pin4"])}
    {net("USB_DN", [".J1 > .Dn1", ".J1 > .Dn2", ".U2 > .pin1", ".U2 > .pin6"])}
    {net("V3V3", [".U2 > .VBUS"])}
    <trace from=".U1 > .VBUS_VS_DISCH" to=".R1 > .pin2" maxLength={TRACE_MAX} />
    <trace from=".U1 > .VREG_1V2" to=".C2 > .pin1" maxLength={TRACE_MAX} />
    <trace from=".U1 > .VREG_2V7" to=".C3 > .pin1" maxLength={TRACE_MAX} />
    {net("I2C_SCL", [".U1 > .SCL"])}
    {net("I2C_SDA", [".U1 > .SDA"])}
    {net("PD_ALERT", [".U1 > .ALERT"])}

    {/* load switch: VBUS_EN_SNK (open drain) pulls the P-FET gate down through R7 once a contract exists;
        R3/R7 limit Vgs to -0.68 * VBUS, C19 slows the turn-on */}
      <AO4407A name="Q1" {...bot(20.3, 7.25)} pcbRotation={90} />
      <R name="R3" {...bot(13.5, 8.7)} v="100k" />
      <R name="R7" {...bot(25.6, 8.5)} pcbRotation={90} v="47k" />
      <C name="C19" {...bot(25.6, 4.8)} pcbRotation={90} v="100nF" />
      <SMBJ22A name="D1" {...bot(20, 2.25)} />
      <ELCAP name="C6" {...bot(19.6, -3.6)} />
      <C name="C7" {...bot(17.5, -10.2)} pcbRotation={90} v="10uF 50V" />
      <C name="C8" {...bot(20, -10.2)} pcbRotation={90} v="10uF 50V" />
    {net("VBUS", [".Q1 > .S1", ".Q1 > .S2", ".Q1 > .S3", ".R3 > .pin1", ".C19 > .pin1"], { thickness: PWR })}
    {net("PD_GATE", [".Q1 > .G", ".R3 > .pin2", ".C19 > .pin2", ".R7 > .pin2"])}
    {net("PD_EN", [".R7 > .pin1", ".U1 > .VBUS_EN_SNK"])}
    {net("VIN", [".Q1 > .D1", ".Q1 > .D2", ".Q1 > .D3", ".Q1 > .D4", ".D1 > .C", ".C6 > .pin1", ".C7 > .pin1", ".C8 > .pin1"], { thickness: VIN_W })}
    {net("GND", [".D1 > .A", ".C6 > .pin2", ".C7 > .pin2", ".C8 > .pin2"], { thickness: PWR })}

    {/* ============================ logic supplies: 5 V buck + 3.3 V LDO (bottom) ============================ */}
      <LMR33630ADDAR name="U3" {...bot(6, 3)} />
      <FXL0530_6R8_M name="L1" {...bot(13, 3.0)} />
      <C name="C9" {...bot(0.8, 3)} pcbRotation={90} v="10uF 50V" />
      <C name="C10" {...bot(3, 6.5)} v="220nF 50V" />
      <C name="C11" {...bot(8.2, 6.6)} v="100nF" />
      <C name="C20" {...bot(9.6, -1.8)} v="1uF" />
      <C name="C12" {...bot(12.9, -1.8)} v="22uF" />
      <C name="C13" {...bot(13, 6.9)} v="22uF" />
      {/* two more 22 uF 25 V on the top side, above L1 (TI validates 4 x 22 uF at 5 V / 400 kHz; review U3:output-cap) */}
      <C name="C23" {...at(13, 1)} pcbRotation={90} v="22uF 25V" />
      <C name="C24" {...at(15.5, 1)} pcbRotation={90} v="22uF 25V" />
      <R name="R4" {...bot(0.5, -1.8)} v="100k" />
      <R name="R5" {...bot(3.5, -2.1)} v="100k" />
      <R name="R6" {...bot(6.5, -1.8)} v="24k" />
    {/* 5 V = 1 V * (1 + 100k / 24k) = 5.17 V (AP2112K: 6 V max) */}
    {net("VIN", [".U3 > .VIN", ".C9 > .pin1", ".C10 > .pin1", ".R4 > .pin1"], { thickness: MID })}
    {net("GND", [".U3 > .PGND", ".U3 > .EP", ".C9 > .pin2", ".C10 > .pin2", ".C12 > .pin2", ".C13 > .pin2", ".C23 > .pin2",
      ".C24 > .pin2", ".C20 > .pin2",
      ".R6 > .pin2"], { thickness: MID })}
    <trace from=".U3 > .EN" to=".R4 > .pin2" maxLength={TRACE_MAX} />
    {net("SW5", [".U3 > .SW", ".L1 > .pin1", ".C11 > .pin2"], { thickness: MID })}
    <trace from=".U3 > .BOOT" to=".C11 > .pin1" maxLength={TRACE_MAX} />
    <trace from=".U3 > .VCC" to=".C20 > .pin1" maxLength={TRACE_MAX} />
    {net("V5", [".L1 > .pin2", ".C12 > .pin1", ".C13 > .pin1", ".C23 > .pin1", ".C24 > .pin1", ".R5 > .pin1"], { thickness: MID })}
    {net("FB5", [".U3 > .FB", ".R5 > .pin2", ".R6 > .pin1"])}
      <AP2112K_3_3TRG1 name="U4" {...bot(4.2, -5)} pcbRotation={90} />
      <C name="C14" {...bot(1, -5)} pcbRotation={90} v="1uF" />
      <C name="C15" {...bot(7.6, -5)} pcbRotation={90} v="10uF" />
    {net("V5", [".U4 > .VIN", ".U4 > .EN", ".C14 > .pin1"], { thickness: MID })}
    {net("V3V3", [".U4 > .VOUT", ".C15 > .pin1"], { thickness: MID })}
    {net("GND", [".U4 > .GND", ".C14 > .pin2", ".C15 > .pin2"])}

    {/* ============================ MCU: ESP32-S3-MINI-1 (bottom, antenna at the +x edge) ============================ */}
    {/* IO8/IO9 = I2C (STUSB4500, 2 x INA226, OLED), IO4/IO5 = PWM voltage set, IO11/IO12 = PWM current set,
        IO6/IO7 = channel enable, IO1/IO2 = NTC (ADC1), IO15/16/17 + IO13/14/18 = encoders A/B/push,
        IO38/IO39 = ON/OFF buttons, IO21/IO47 = CC LEDs, IO19/IO20 = native USB, IO10 = PD alert, IO0 = boot. */}
    <ESP32_S3_MINI_1_N8 name="U5" {...bot(34.5, -2)} pcbRotation={-90} />
      <C name="C16" {...bot(25.5, -4.5)} pcbRotation={90} v="10uF" />
      <C name="C17" {...bot(25.6, -8)} pcbRotation={90} v="100nF" />
      <R name="R9" {...bot(14, -22)} v="10k" />
      <C name="C18" {...bot(14, -24.5)} v="1uF" />
      <TS_1187A_B_A_B name="SW1" {...bot(20, -24.5)} />
      <R name="R10" {...bot(24.6, -28.3)} v="10k" />
      <TS_1187A_B_A_B name="SW2" {...bot(28.2, -24.5)} />
      <R name="R11" {...bot(23, -12.4)} v="4.7k" />
      <R name="R12" {...bot(26, -12.4)} v="4.7k" />
      <R name="R13" {...bot(29, -12.4)} v="10k" />
    {net("V3V3", [".U5 > .3V3", ".C16 > .pin1", ".C17 > .pin1", ".R9 > .pin1", ".R10 > .pin1", ".R11 > .pin1",
      ".R12 > .pin1", ".R13 > .pin1"], { thickness: MID })}
    {net("GND", [".U5 > .GND1", ".U5 > .GND2", ".U5 > .GND3", ".U5 > .GND4", ".U5 > .GND5", ".U5 > .GND6", ".U5 > .GND7",
      ".U5 > .GND8", ".U5 > .GND9", ".U5 > .GND10", ".U5 > .GND11", ".U5 > .GND12", ".U5 > .GND13", ".U5 > .GND14",
      ".U5 > .GND15", ".U5 > .GND16", ".U5 > .GND17", ".U5 > .GND18", ".U5 > .GND19", ".U5 > .GND20",
      ".C16 > .pin2", ".C17 > .pin2", ".C18 > .pin2", ".SW1 > .pin2", ".SW2 > .pin2"])}
    {net("EN_RST", [".U5 > .EN", ".R9 > .pin2", ".C18 > .pin1", ".SW1 > .pin1"])}
    {net("BOOT", [".U5 > .IO0", ".R10 > .pin2", ".SW2 > .pin1"])}
    {net("USB_DN", [".U5 > .IO19"])}
    {net("USB_DP", [".U5 > .IO20"])}
    {net("I2C_SDA", [".U5 > .IO8", ".R11 > .pin2"])}
    {net("I2C_SCL", [".U5 > .IO9", ".R12 > .pin2"])}
    {net("PD_ALERT", [".U5 > .IO10", ".R13 > .pin2"])}
    {net("PWM1", [".U5 > .IO4"])}
    {net("PWM2", [".U5 > .IO5"])}
    {net("ISET1", [".U5 > .IO11"])}
    {net("ISET2", [".U5 > .IO12"])}
    {net("EN1_MCU", [".U5 > .IO6"])}
    {net("EN2_MCU", [".U5 > .IO7"])}
    {net("NTC1", [".U5 > .IO1"])}
    {net("NTC2", [".U5 > .IO2"])}
    {net("ENC1_A", [".U5 > .IO15"])}
    {net("ENC1_B", [".U5 > .IO16"])}
    {net("ENC1_SW", [".U5 > .IO17"])}
    {net("ENC2_A", [".U5 > .IO13"])}
    {net("ENC2_B", [".U5 > .IO14"])}
    {net("ENC2_SW", [".U5 > .IO18"])}
    {net("BTN1", [".U5 > .IO38"])}
    {net("BTN2", [".U5 > .IO39"])}

    {/* ============================ output channels (bottom) ============================ */}
    <Channel n={1} ox={-35.5} oy={18.5} />
    <Channel n={2} ox={-35.5} oy={-4.5} />
    {/* op-amps of both channels: U6 = FB current sinks (A = CH1, B = CH2), U7 = CC error amps */}
    <TLV9062IDR name="U6" {...bot(2.0, -10)} pcbRotation={90} />
      <C name="C21" {...bot(4.5, -13.6)} v="100nF" />
    <TLV9062IDR name="U7" {...bot(12.3, -10)} pcbRotation={90} />
      <C name="C22" {...bot(9.5, -13.6)} v="100nF" />
    {net("V3V3", [".U6 > .V_POS", ".C21 > .pin1", ".U7 > .V_POS", ".C22 > .pin1"])}
    {net("GND", [".U6 > .V_NEG", ".C21 > .pin2", ".U7 > .V_NEG", ".C22 > .pin2"])}

    {/* ============================ front panel (top) ============================ */}
    <pinheader name="J3" pinCount={4} pitch="2.54mm" {...at(-28, 27)}
      supplierPartNumbers={{ jlcpcb: ["C492403"] }} manufacturerPartNumber="PZ254V-11-04P"
      pinLabels={["GND", "VCC", "SCL", "SDA"]} />
    {net("GND", [".J3 > .pin1"])}
    {net("V3V3", [".J3 > .pin2"])}
    {net("I2C_SCL", [".J3 > .pin3"])}
    {net("I2C_SDA", [".J3 > .pin4"])}
    <DG301_5_0_04P_14_1000A_H_ name="J2" {...at(-28, -25.5)} />
    {net("OUT1", [".J2 > .pin1"], { thickness: PWR })}
    {net("GND", [".J2 > .pin2", ".J2 > .pin4"], { thickness: PWR })}
    {net("OUT2", [".J2 > .pin3"], { thickness: PWR })}
    {/* output bulk (review U11/U21:output-cap): the 4 x 22 uF ceramics derate to ~18 uF at 16 V while the loop gain is
        fixed (FB divider 0.625); 100 uF electrolytic keeps Cout from collapsing and its ESR (~0.3 Ohm) adds a damping
        zero (~5 kHz). Top side by the terminal, where the front panel is empty. */}
    <ELCAP name="C25" {...at(-15, -15)} pcbRotation={90} />
    <ELCAP name="C26" {...at(-6, -15)} pcbRotation={90} />
    {net("OUT1", [".C25 > .pin1"], { thickness: PWR })}
    {net("OUT2", [".C26 > .pin1"], { thickness: PWR })}
    {net("GND", [".C25 > .pin2", ".C26 > .pin2"], { thickness: PWR })}
    <Controls n={1} cx={CH1X} ccGpio="IO21" />
    <Controls n={2} cx={CH2X} ccGpio="IO47" />

    {/* ============================ test points (bottom) and mounting ============================ */}
    {[["VBUS", 2], ["VIN", 5], ["V5", 8], ["V3V3", 11], ["GND", -1]].map(([name, x], i) => (
      <>
        <testpoint key={`tp${i}`} name={`TP${i + 1}`} footprintVariant="pad" padShape="circle" padDiameter="1mm"
          {...bot(x as number, -28)} />
        <silkscreentext key={`tpl${i}`} text={name === "V3V3" ? "3V3" : (name as string)} {...bot(x as number, -26.3)}
          fontSize="0.8mm" />
        {net(name as string, [`.TP${i + 1} > .pin1`])}
      </>
    ))}
    {[[-41.5, 26.5], [41.5, 26.5], [-41.5, -26.5], [41.5, -26.5]].map(([x, y]) => (
      <>
        <hole key={`mh${x}${y}`} diameter="3.2mm" {...at(x, y)} />
        {/* screw head / standoff: the router keeps tracks and vias out (vibepcb.toml keepouts reach only KiCad) */}
        <keepout key={`mhk${x}${y}`} shape="circle" radius="3.5mm" allowPlacements {...at(x, y)} />
      </>
    ))}

    <copperpour connectsTo="net.GND" layer="top" clearance="0.3mm" boardEdgeMargin="0.5mm" />
    <copperpour connectsTo="net.GND" layer="inner1" clearance="0.3mm" boardEdgeMargin="0.5mm" />
    <copperpour connectsTo="net.GND" layer="inner2" clearance="0.3mm" boardEdgeMargin="0.5mm" />
    <copperpour connectsTo="net.GND" layer="bottom" clearance="0.3mm" boardEdgeMargin="0.5mm" />

    {/* top: front panel labels */}
    <silkscreentext text="bench-psu rev C" pcbX={-8.5} pcbY={-25} fontSize="1.2mm" />
    <silkscreentext text="CH1+  CH1-  CH2+  CH2-" pcbX={-28} pcbY={-21.8} fontSize="1mm" />
    {[["GND", -31.81], ["VCC", -29.27], ["SCL", -26.73], ["SDA", -24.19]].map(([t, x]) => (
      <silkscreentext key={`oled${x}`} text={t as string} pcbX={x as number} pcbY={25.2} fontSize="0.8mm" />
    ))}
    <silkscreentext text="OLED 0.96in SSD1306" pcbX={-28} pcbY={23.6} fontSize="0.8mm" />
    {/* bottom */}
    <silkscreentext text="RST" {...bot(20, -21.2)} fontSize="0.9mm" />
    <silkscreentext text="BOOT" {...bot(28.2, -21.2)} fontSize="0.9mm" />
    <silkscreentext text="bench-psu rev C - USB-C PD 20 V in" {...bot(-10, -28.4)} fontSize="1mm" />
  </board>
)
