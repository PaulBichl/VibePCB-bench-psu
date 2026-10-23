import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"]
} as const

export const ESDA25P35_1U1M = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
supplierPartNumbers={{
  "jlcpcb": [
    "C1974707"
  ]
}}
      manufacturerPartNumber="ESDA25P35-1U1M"
      footprint="smdpads2_p1.0498mm_pw0.6mm_ph0.9mm_cyw2.1498mm_cyh1.5mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C1974707.obj?uuid=f410d8974c0443bc9ff656f954d8e306",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C1974707.step?uuid=f410d8974c0443bc9ff656f954d8e306",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.0000762000000804619, z: -0.02 },
      }}
      {...props}
    />
  )
}