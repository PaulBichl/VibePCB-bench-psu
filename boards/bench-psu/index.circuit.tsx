// VibePCB bench-psu: USB-C PD powered 2-channel programmable bench supply, 1.6..16 V / 3 A per channel.
// 90 x 76 mm, 4 layers. Top edge (+y): USB-C. Bottom edge (-y): 4-pole output terminal (CH1+ CH1- CH2+ CH2-).
// Right edge (x = +45): 4-pin header for a 0.96" SSD1306 I2C OLED module, 5-pin header for a KY-040 style encoder module.
// Build with: hatch run pcb all bench-psu
//
// Architecture (design decisions)
// - Input: USB-C PD sink (STUSB4500, NVM requests 20 V; written once by the ESP32 over I2C, see README) -> P-FET -> VIN.
// - Converter: the input is never below the output (PD fixes 20 V, output <= 16 V), so a plain step-down is enough
//   (no buck-boost: it would need a part JLCPCB does not stock). One LMR51635 buck (1.1 MHz, 3.5 A) per channel.
//   Output voltage is set by the ESP32: a 14-bit PWM, RC filtered (2 x 10k/1uF), injects current into the feedback node:
//   Vout = 0.8 V * (1 + Rt/Rb) - Rt/Ri * (Vpwm - 0.8 V) -> 18.1 V at 0 V PWM, 1.6 V at 3.3 V PWM, ~1 mV per PWM step.
//   The firmware closes the loop with the INA219 bus-voltage reading and caps the setpoint at 16 V.
// - Enable: the ESP32 drives the buck EN pin (100k pull-down: outputs off at reset).
// - Measure: INA219 per channel (0x40 / 0x41) on a 0.1 R high-side shunt (3.2 A full scale, +-320 mV range);
//   the firmware turns the channel off above the set current limit (the buck's own limit is 3.5 A peak).
// - Control: ESP32-S3-MINI-1 (native USB for flashing/CDC, Bluetooth LE for load curves), 3.3 V from a 5 V buck + LDO.
import {
  AO4407A, AP2112K_3_3TRG1, DG301_5_0_04P_14_1000A_H_, ESP32_S3_MINI_1_N8, INA219AIDCNR, LMR51635XDDCR,
  NXA63V100M8_15_LO as ELCAP, SMBJ24A, STUSB4500QTR, SWPA6045S100MT, TS_1187A_B_A_B, TYPE_C_16PIN_2MD_073_, USBLC6_2SC6,
} from "./imports"
import { C, R, RSENSE, TRACE_MAX, net } from "./parts"

const PWR = "0.8mm" // VIN / output path
const MID = "0.4mm" // 5 V, 3.3 V, switch-node-adjacent

// USB / supply blocks are placed in the coordinates of a 90 x 76 board: (x, y) relative to the board centre
const at = (x: number, y: number) => ({ pcbX: x, pcbY: y })

/** One output channel n (1 or 2) at (ox, oy): buck + feedback/PWM injection + shunt + INA219. */
const Channel = ({ n, ox, oy }: { n: 1 | 2; ox: number; oy: number }) => {
  const p = (x: number, y: number) => at(ox + x, oy + y)
  const id = (s: string, i: number) => `${s}${n}${String(i).padStart(2, "0")}`
  const U = `U${n}1`
  const L = `L${n}1`
  const INA = `U${n}2`
  const SH = id("R", 1)
  const SW = `SW${n}`
  const OUTB = `OUT${n}_B`
  const OUT = `OUT${n}`
  const FB = `FB${n}`
  return (
    <>
      <LMR51635XDDCR name={U} {...p(0, 0)} />
      <SWPA6045S100MT name={L} {...p(9, 0)} />
      <C name={id("C", 1)} {...p(-5.5, 0)} pcbRotation={90} v="2.2uF 100V" />
      <C name={id("C", 2)} {...p(-5.5, -5.5)} pcbRotation={90} v="2.2uF 100V" />
      <C name={id("C", 3)} {...p(-3, 3.5)} v="100nF 100V" />
      <C name={id("C", 4)} {...p(3, 3.5)} v="100nF" />
      <C name={id("C", 5)} {...p(15, 0)} pcbRotation={90} v="4.7uF 100V" />
      <C name={id("C", 6)} {...p(18.5, 0)} pcbRotation={90} v="4.7uF 100V" />
      <C name={id("C", 7)} {...p(22, 0)} pcbRotation={90} v="4.7uF 100V" />
      <ELCAP name={id("C", 9)} {...p(29, 0)} />
      <RSENSE name={SH} {...p(37, 0)} v="100m" />
      <INA219AIDCNR name={INA} {...p(37, -7.5)} />
      <C name={id("C", 8)} {...p(41, -6.5)} v="100nF" />
      {/* Vout = 0.8 V * (1 + 100k / 6k) - 5 * (Vpwm - 0.8 V): 18.1 V .. 1.6 V */}
      <R name={id("R", 2)} {...p(2, -6)} v="100k" />
      <R name={id("R", 3)} {...p(5, -6)} v="12k" />
      <R name={id("R", 4)} {...p(8, -6)} v="12k" />
      <R name={id("R", 5)} {...p(11, -6)} v="20k" />
      <R name={id("R", 6)} {...p(14, -6)} v="10k" />
      <R name={id("R", 7)} {...p(17, -6)} v="10k" />
      <C name={id("C", 10)} {...p(14, -8.5)} v="1uF" />
      <C name={id("C", 11)} {...p(17, -8.5)} v="1uF" />
      <R name={id("R", 8)} {...p(-1, -9.5)} v="100k" />

      {net("VIN", [`.${U} > .VIN`, `.${id("C", 1)} > .pin1`, `.${id("C", 2)} > .pin1`, `.${id("C", 3)} > .pin1`], { thickness: PWR })}
      {net("GND", [`.${U} > .GND`, `.${id("C", 1)} > .pin2`, `.${id("C", 2)} > .pin2`, `.${id("C", 3)} > .pin2`,
        `.${id("C", 5)} > .pin2`, `.${id("C", 6)} > .pin2`, `.${id("C", 7)} > .pin2`, `.${id("C", 9)} > .pin2`,
        `.${id("R", 3)} > .pin2`, `.${id("R", 4)} > .pin2`, `.${id("C", 10)} > .pin2`, `.${id("C", 11)} > .pin2`,
        `.${id("R", 8)} > .pin2`, `.${INA} > .GND`, `.${id("C", 8)} > .pin2`])}
      {net(SW, [`.${U} > .SW`, `.${L} > .pin1`, `.${id("C", 4)} > .pin2`], { thickness: MID })}
      <trace from={`.${U} > .CB`} to={`.${id("C", 4)} > .pin1`} maxLength={TRACE_MAX} />
      {net(OUTB, [`.${L} > .pin2`, `.${id("C", 5)} > .pin1`, `.${id("C", 6)} > .pin1`, `.${id("C", 7)} > .pin1`,
        `.${id("C", 9)} > .pin1`, `.${SH} > .pin1`, `.${INA} > .IN_POS`, `.${id("R", 2)} > .pin1`], { thickness: PWR })}
      {net(OUT, [`.${SH} > .pin2`, `.${INA} > .IN_NEG`], { thickness: PWR })}
      {net(FB, [`.${U} > .FB`, `.${id("R", 2)} > .pin2`, `.${id("R", 3)} > .pin1`, `.${id("R", 4)} > .pin1`, `.${id("R", 5)} > .pin1`])}
      <trace from={`.${id("R", 5)} > .pin2`} to={`.${id("R", 6)} > .pin1`} maxLength={TRACE_MAX} />
      <trace from={`.${id("R", 6)} > .pin2`} to={`.${id("R", 7)} > .pin1`} maxLength={TRACE_MAX} />
      <trace from={`.${id("R", 5)} > .pin2`} to={`.${id("C", 10)} > .pin1`} maxLength={TRACE_MAX} />
      <trace from={`.${id("R", 7)} > .pin2`} to={`.${id("C", 11)} > .pin1`} maxLength={TRACE_MAX} />
      {net(`PWM${n}`, [`.${id("R", 6)} > .pin1`])}
      {net(`EN${n}`, [`.${U} > .EN`, `.${id("R", 8)} > .pin1`])}
      {net("V3V3", [`.${INA} > .VS`, `.${id("C", 8)} > .pin1`])}
      {net("I2C_SCL", [`.${INA} > .SCL`])}
      {net("I2C_SDA", [`.${INA} > .SDA`])}
      {net(n === 1 ? "GND" : "V3V3", [`.${INA} > .A0`])}
      {net("GND", [`.${INA} > .A1`])}
    </>
  )
}

export default () => (
  <board
    width="90mm"
    height="76mm"
    layers={4}
    minTraceWidth="0.15mm"
    minTraceToPadEdgeClearance="0.1mm"
    minBoardEdgeClearance="0.5mm"
    minViaHoleDiameter="0.3mm"
    minViaPadDiameter="0.5mm"
    minViaEdgeToPadEdgeClearance="0.2mm"
    autorouterEffortLevel="10x"
    schematicDisabled
  >
    {/* ============================ USB-C PD input ============================ */}
    <TYPE_C_16PIN_2MD_073_ name="J1" {...at(-35, 32.8)} pcbRotation={180} />
      <STUSB4500QTR name="U1" {...at(-22, 27)} />
      <C name="C1" {...at(-26.5, 29.5)} pcbRotation={90} v="1uF" />
      <C name="C2" {...at(-17.5, 29.5)} pcbRotation={90} v="1uF" />
      <C name="C3" {...at(-17.5, 26)} pcbRotation={90} v="1uF" />
      <C name="C4" {...at(-26.5, 26)} pcbRotation={90} v="100nF" />
      <R name="R1" {...at(-22, 22)} v="1k" />
      <R name="R2" {...at(-41, 24)} pcbRotation={90} v="1M" />
      <C name="C5" {...at(-39, 24)} pcbRotation={90} v="4.7nF" />
      <USBLC6_2SC6 name="U2" {...at(-31, 23.5)} />
    {net("VBUS", [".J1 > .VBUS1", ".J1 > .VBUS2", ".U1 > .VDD", ".C1 > .pin1", ".C4 > .pin1", ".R1 > .pin1"], { thickness: PWR })}
    {net("GND", [".J1 > .GND1", ".J1 > .GND2", ".U1 > .GND", ".U1 > .EP", ".U1 > .VSYS", ".U1 > .RESET",
      ".U1 > .ADDR0", ".U1 > .ADDR1", ".C1 > .pin2", ".C2 > .pin2", ".C3 > .pin2", ".C4 > .pin2", ".R2 > .pin2",
      ".C5 > .pin2", ".U2 > .GND"])}
    {net("USB_SHIELD", [".J1 > .EH1", ".J1 > .EH2", ".J1 > .EH3", ".J1 > .EH4", ".R2 > .pin1", ".C5 > .pin1"])}
    {net("CC1", [".J1 > .CC1", ".U1 > .CC1", ".U1 > .CC1DB"])}
    {net("CC2", [".J1 > .CC2", ".U1 > .CC2", ".U1 > .CC2DB"])}
    {net("USB_DP", [".J1 > .Dp1", ".J1 > .Dp2", ".U2 > .pin3", ".U2 > .pin4"])}
    {net("USB_DN", [".J1 > .Dn1", ".J1 > .Dn2", ".U2 > .pin1", ".U2 > .pin6"])}
    {net("V3V3", [".U2 > .VBUS"])}
    <trace from=".U1 > .VBUS_VS_DISCH" to=".R1 > .pin2" maxLength={TRACE_MAX} />
    <trace from=".U1 > .VREG_1V2" to=".C2 > .pin1" maxLength={TRACE_MAX} />
    <trace from=".U1 > .VREG_2V7" to=".C3 > .pin1" maxLength={TRACE_MAX} />
    {net("I2C_SCL", [".U1 > .SCL"])}
    {net("I2C_SDA", [".U1 > .SDA"])}
    {net("PD_ALERT", [".U1 > .ALERT"])}

    {/* load switch: VBUS_EN_SNK (open drain) pulls the P-FET gate low once a contract exists */}
      <AO4407A name="Q1" {...at(-9.5, 32.5)} />
      <R name="R3" {...at(-9, 27.6)} v="100k" />
      <SMBJ24A name="D1" {...at(-9, 24)} />
      <ELCAP name="C6" {...at(-9, 16)} />
      <C name="C7" {...at(-14.5, 18.5)} pcbRotation={90} v="2.2uF 100V" />
      <C name="C8" {...at(-3.5, 18.5)} pcbRotation={90} v="2.2uF 100V" />
    {net("VBUS", [".Q1 > .S1", ".Q1 > .S2", ".Q1 > .S3", ".R3 > .pin1"], { thickness: PWR })}
    {net("PD_GATE", [".Q1 > .G", ".R3 > .pin2", ".U1 > .VBUS_EN_SNK"])}
    {net("VIN", [".Q1 > .D1", ".Q1 > .D2", ".Q1 > .D3", ".Q1 > .D4", ".D1 > .C", ".C6 > .pin1", ".C7 > .pin1", ".C8 > .pin1"], { thickness: PWR })}
    {net("GND", [".D1 > .A", ".C6 > .pin2", ".C7 > .pin2", ".C8 > .pin2"], { thickness: PWR })}

    {/* ============================ logic supplies: 5 V buck + 3.3 V LDO ============================ */}
      <LMR51635XDDCR name="U3" {...at(-31, 12)} />
      <SWPA6045S100MT name="L1" {...at(-22, 12)} />
      <C name="C9" {...at(-36.5, 12)} pcbRotation={90} v="2.2uF 100V" />
      <C name="C10" {...at(-34, 15.5)} v="100nF 100V" />
      <C name="C11" {...at(-28, 15.5)} v="100nF" />
      <C name="C12" {...at(-16.5, 13.5)} pcbRotation={90} v="22uF" />
      <C name="C13" {...at(-16.5, 10)} pcbRotation={90} v="22uF" />
      <R name="R4" {...at(-35, 7.5)} v="100k" />
      <R name="R5" {...at(-32, 7.5)} v="100k" />
      <R name="R6" {...at(-29, 7.5)} v="20k" />
    {/* 5 V = 0.8 V * (1 + 100k / 20k) = 4.8 V */}
    {net("VIN", [".U3 > .VIN", ".C9 > .pin1", ".C10 > .pin1", ".R4 > .pin1"], { thickness: MID })}
    {net("GND", [".U3 > .GND", ".C9 > .pin2", ".C10 > .pin2", ".C12 > .pin2", ".C13 > .pin2", ".R6 > .pin2"], { thickness: MID })}
    <trace from=".U3 > .EN" to=".R4 > .pin2" maxLength={TRACE_MAX} />
    {net("SW5", [".U3 > .SW", ".L1 > .pin1", ".C11 > .pin2"], { thickness: MID })}
    <trace from=".U3 > .CB" to=".C11 > .pin1" maxLength={TRACE_MAX} />
    {net("V5", [".L1 > .pin2", ".C12 > .pin1", ".C13 > .pin1", ".R5 > .pin1"], { thickness: MID })}
    {net("FB5", [".U3 > .FB", ".R5 > .pin2", ".R6 > .pin1"])}
      <AP2112K_3_3TRG1 name="U4" {...at(-39, 1)} />
      <C name="C14" {...at(-42.5, 1)} pcbRotation={90} v="1uF" />
      <C name="C15" {...at(-35.5, 1)} pcbRotation={90} v="10uF" />
    {net("V5", [".U4 > .VIN", ".U4 > .EN", ".C14 > .pin1"], { thickness: MID })}
    {net("V3V3", [".U4 > .VOUT", ".C15 > .pin1"], { thickness: MID })}
    {net("GND", [".U4 > .GND", ".C14 > .pin2", ".C15 > .pin2"])}

    {/* ============================ MCU: ESP32-S3-MINI-1 ============================ */}
    {/* IO8/IO9 = I2C (STUSB4500, 2 x INA219, OLED), IO4/IO5 = PWM voltage set, IO6/IO7 = channel enable,
        IO15/16/17 = encoder A/B/switch, IO19/IO20 = native USB, IO10 = PD alert, IO0 = boot. Antenna end at the +y board edge. */}
    <ESP32_S3_MINI_1_N8 name="U5" {...at(27, 27.5)} />
      <C name="C16" {...at(17, 14)} v="10uF" />
      <C name="C17" {...at(17, 11.5)} v="100nF" />
      <R name="R9" {...at(12, 5)} v="10k" />
      <C name="C18" {...at(12, 7.5)} v="1uF" />
      <TS_1187A_B_A_B name="SW1" {...at(5, 8)} />
      <R name="R10" {...at(12, 2)} v="10k" />
      <TS_1187A_B_A_B name="SW2" {...at(5, 2)} />
      <R name="R11" {...at(8, 14)} v="4.7k" />
      <R name="R12" {...at(8, 16.5)} v="4.7k" />
      <R name="R13" {...at(8, 19)} v="10k" />
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
    {net("EN1", [".U5 > .IO6"])}
    {net("EN2", [".U5 > .IO7"])}
    {net("ENC_A", [".U5 > .IO15"])}
    {net("ENC_B", [".U5 > .IO16"])}
    {net("ENC_SW", [".U5 > .IO17"])}

    {/* ============================ output channels ============================ */}
    <Channel n={1} ox={-37} oy={-12} />
    <Channel n={2} ox={-37} oy={-27} />
    <DG301_5_0_04P_14_1000A_H_ name="J2" {...at(24, -30)} />
    {net("OUT1", [".J2 > .pin1"], { thickness: PWR })}
    {net("GND", [".J2 > .pin2", ".J2 > .pin4"], { thickness: PWR })}
    {net("OUT2", [".J2 > .pin3"], { thickness: PWR })}

    {/* ============================ front panel: OLED + encoder modules ============================ */}
    <pinheader name="J3" pinCount={4} pitch="2.54mm" {...at(42, 2)} pcbRotation={90}
      supplierPartNumbers={{ jlcpcb: ["C492403"] }} manufacturerPartNumber="PZ254V-11-04P"
      pinLabels={["GND", "VCC", "SCL", "SDA"]} showSilkscreenPinLabels />
    <pinheader name="J4" pinCount={5} pitch="2.54mm" {...at(42, -12)} pcbRotation={90}
      supplierPartNumbers={{ jlcpcb: ["C492404"] }} manufacturerPartNumber="PZ254V-11-05P"
      pinLabels={["CLK", "DT", "SW", "VCC", "GND"]} showSilkscreenPinLabels />
    {net("GND", [".J3 > .pin1", ".J4 > .pin5"])}
    {net("V3V3", [".J3 > .pin2", ".J4 > .pin4"])}
    {net("I2C_SCL", [".J3 > .pin3"])}
    {net("I2C_SDA", [".J3 > .pin4"])}
    {net("ENC_A", [".J4 > .pin1"])}
    {net("ENC_B", [".J4 > .pin2"])}
    {net("ENC_SW", [".J4 > .pin3"])}

    <copperpour connectsTo="net.GND" layer="top" clearance="0.3mm" boardEdgeMargin="0.5mm" />
    <copperpour connectsTo="net.GND" layer="inner1" clearance="0.3mm" boardEdgeMargin="0.5mm" />
    <copperpour connectsTo="net.GND" layer="inner2" clearance="0.3mm" boardEdgeMargin="0.5mm" />
    <copperpour connectsTo="net.GND" layer="bottom" clearance="0.3mm" boardEdgeMargin="0.5mm" />

    <silkscreentext text="bench-psu rev A" pcbX={0} pcbY={-35.5} fontSize="1.2mm" />
    <silkscreentext text="CH1+ CH1- CH2+ CH2-" pcbX={24} pcbY={-24} fontSize="1mm" />
    <silkscreentext text="RST" pcbX={5} pcbY={11} fontSize="1mm" />
    <silkscreentext text="BOOT" pcbX={5} pcbY={5} fontSize="1mm" />
  </board>
)
