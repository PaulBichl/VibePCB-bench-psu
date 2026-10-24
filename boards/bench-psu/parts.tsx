// Passive helpers with LCSC numbers (JLCPCB basic parts where one exists).
// R/C/L/D take the usual tscircuit props; `v` is the value string, looked up below.

// 0603 1 % thick film unless noted
const RES: Record<string, string> = {
  "0": "C21189", "1": "C174300", "10": "C22859", "49.9": "C23185", "100": "C22775", "330": "C23138", "680": "C23228",
  "1k": "C21190", "2.2k": "C4190", "2.4k": "C22940", "3.3k": "C22978", "4.3k": "C23159", "4.7k": "C23162", "6.8k": "C23212", "9.1k": "C23260",
  "10k": "C25804", "12k": "C22790", "12.4k": "C2930060", "20k": "C4184", "24k": "C23352", "47k": "C25819", "200k": "C25811", "27k": "C22967", "49.9k": "C23184",
  "75k": "C23242", "100k": "C25803", "120k": "C25808", "150k": "C22807", "390k": "C23150", "1M": "C22935",
}
// 0603 0.1 % 25 ppm thin film (gain-setting networks)
const RES_PREC: Record<string, string> = {
  "10k": "C95204", "120k": "C351687", "300k": "C335091", "5.6k": "C179095",
}
// capacitors: value -> [footprint, LCSC]
const CAP: Record<string, [string, string]> = {
  "15pF": ["0603", "C1644"],
  "22pF": ["0603", "C1653"],
  "470pF": ["0603", "C1620"],
  "1nF": ["0603", "C1588"],
  "4.7nF": ["0603", "C53987"],
  "4.7nF C0G": ["0805", "C107104"],
  "6.8nF": ["0603", "C1631"],
  "10nF": ["0603", "C100042"],
  "22nF": ["0603", "C21122"],
  "47nF": ["0603", "C107093"],
  "100nF": ["0603", "C14663"],
  "100nF 100V": ["0805", "C28233"],
  "220nF": ["0603", "C21120"],
  "220nF 50V": ["0603", "C107083"],
  "1uF": ["0603", "C15849"],
  "1uF 100V": ["1206", "C13832"],
  "2.2uF 100V": ["1206", "C170101"],
  "4.7uF": ["0603", "C19666"],
  "4.7uF 100V": ["1210", "C337978"],
  "10uF": ["0805", "C15850"],
  "10uF 50V": ["1206", "C13585"],
  "22uF 25V": ["1206", "C12891"],
  "22uF": ["0805", "C45783"],
}

type P = Record<string, unknown> & { name: string }

export const R = ({ v, ...p }: P & { v: string }) => (
  <resistor resistance={v} footprint="0603" supplierPartNumbers={{ jlcpcb: [RES[v]] }} {...p} />
)
/** 0.1 % / 25 ppm thin film */
export const RP = ({ v, ...p }: P & { v: string }) => (
  <resistor resistance={v} footprint="0603" tolerance="0.1%" supplierPartNumbers={{ jlcpcb: [RES_PREC[v]] }} {...p} />
)
export const C = ({ v, ...p }: P & { v: string }) => {
  const [fp, lcsc] = CAP[v]
  return <capacitor capacitance={v.split(" ")[0]} footprint={fp} supplierPartNumbers={{ jlcpcb: [lcsc] }} {...p} />
}
/** current-sense resistors, 2512, 1 % */
const SHUNT: Record<string, string> = { "15m": "C154674", "20m": "C105360", "100m": "C500724" }
export const RSENSE = ({ v, ...p }: P & { v: "15m" | "20m" | "100m" }) => (
  <resistor
    resistance={v}
    footprint="2512"
    supplierPartNumbers={{ jlcpcb: [SHUNT[v]] }}
    {...p}
  />
)
export const FERRITE = (p: P) => (
  <inductor inductance="1uH" footprint="0603" manufacturerPartNumber="BLM18PG221SN1D"
    supplierPartNumbers={{ jlcpcb: ["C80165"] }} {...p} />
)

/** one trace per pin to `net.<net>`. The explicit maxLength switches off tscircuit's hidden
 *  1 mm limit on capacitor-to-pin traces (decoupling heuristic), which skips all routing. */
export const net = (name: string, pins: string[], props: Record<string, unknown> = {}) =>
  pins.map((p) => <trace key={`${name}:${p}`} from={p} to={`net.${name}`} maxLength="300mm" {...props} />)
export const TRACE_MAX = "300mm"
