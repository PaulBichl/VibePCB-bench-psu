import type { DiodeProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["anode","pos"],
  pin2: ["cathode","neg"]
} as const

export const SS54 = (props: DiodeProps) => {
  const { name = "D1", ...restProps } = props

  return (
    <diode
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C22452"
  ]
}}
      manufacturerPartNumber="SS54"
      footprint={<footprint>
        <smtpad portHints={["pin1","anode","pos"]} pcbX="2.503678mm" pcbY="0mm" width="2.0625054mm" height="1.5390114mm" shape="rect" />
<smtpad portHints={["pin2","cathode","neg"]} pcbX="-2.503678mm" pcbY="0mm" width="2.0625054mm" height="1.5390114mm" shape="rect" />
<silkscreenpath route={[{"x":-2.646197400000119,"y":1.3562076000000616},{"x":2.646197399999892,"y":1.3562076000000616}]} />
<silkscreenpath route={[{"x":-2.646197400000119,"y":-1.3562075999999479},{"x":2.646197399999892,"y":-1.3562075999999479}]} />
<silkscreenpath route={[{"x":-1.2692888000000266,"y":1.3562076000000616},{"x":-1.2692888000000266,"y":-1.3562075999999479}]} />
<silkscreenpath route={[{"x":2.646197399999892,"y":1.3562076000000616},{"x":2.646197399999892,"y":0.9726930000000493}]} />
<silkscreenpath route={[{"x":2.646197399999892,"y":-1.3562075999999479},{"x":2.646197399999892,"y":-0.9726929999999356}]} />
<silkscreentext text="{NAME}" pcbX="0mm" pcbY="2.4224mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":-2.377998800000114,"y":-0.09601200000008703},{"x":-2.377998800000114,"y":0.09601200000008703},{"x":-1.6100043999999798,"y":0.09601200000008703},{"x":-1.6100043999999798,"y":-0.09601200000008703},{"x":-2.377998800000114,"y":-0.09601200000008703}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":2.3779988000000003,"y":-0.09601200000008703},{"x":2.3779988000000003,"y":0.09601200000008703},{"x":1.6100043999999798,"y":0.09601200000008703},{"x":1.6100043999999798,"y":-0.09601200000008703},{"x":2.3779988000000003,"y":-0.09601200000008703}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":2.0899881999999934,"y":-0.6400037999999313},{"x":2.0899881999999934,"y":0.640003800000045},{"x":1.8979895999999599,"y":0.640003800000045},{"x":1.8979895999999599,"y":-0.6400037999999313},{"x":2.0899881999999934,"y":-0.6400037999999313}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-3.784930700000018,"y":1.6499972000000298},{"x":3.7849306999999044,"y":1.6499972000000298},{"x":3.7849306999999044,"y":-1.6499972000001435},{"x":-3.784930700000018,"y":-1.6499972000001435},{"x":-3.784930700000018,"y":1.6499972000000298}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C22452.obj?uuid=16f5f0e72b3e4f43a77ecac0b819c7f8",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C22452.step?uuid=16f5f0e72b3e4f43a77ecac0b819c7f8",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.1 },
      }}
      {...restProps}
    />
  )
}