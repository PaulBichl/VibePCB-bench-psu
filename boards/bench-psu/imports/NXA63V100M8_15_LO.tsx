import type { CapacitorProps } from "@tscircuit/props"

export const NXA63V100M8_15_LO = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="100uF"
      polarized
      supplierPartNumbers={{
  "jlcpcb": [
    "C3002361"
  ]
}}
      manufacturerPartNumber="NXA63V100M8*15 LO"
      footprint="pinrow2_nosquareplating_p3.5mm_od1.6mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C3002361.obj?uuid=a759aa17c2f544aaaf5f26e96ec58dee",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C3002361.step?uuid=a759aa17c2f544aaaf5f26e96ec58dee",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.005148500000113465, y: 0, z: 0.009989999999999277 },
      }}
      {...restProps}
    />
  )
}