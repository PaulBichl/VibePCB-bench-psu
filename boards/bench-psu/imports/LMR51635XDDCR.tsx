import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["FB"],
  pin2: ["EN"],
  pin3: ["VIN"],
  pin4: ["GND"],
  pin5: ["SW"],
  pin6: ["CB"]
} as const

const pinAttributes = {
  pin3: {requiresPower: true},
  pin4: {requiresGround: true}
} as const

export const LMR51635XDDCR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C45262770"
  ]
}}
      manufacturerPartNumber="LMR51635YDDCR"
      footprint="soic6_p0.95mm_w3.8mm_pl1.1mm_pin1location(rightside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C42432812.obj?uuid=229b69761e2c45dba6a83d8866dec72d",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C42432812.step?uuid=229b69761e2c45dba6a83d8866dec72d",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0.000025399999913133797, y: -0.0000889000000370288, z: -0.048939 },
      }}
      {...props}
    />
  )
}