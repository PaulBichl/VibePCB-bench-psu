import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["C"],
  pin2: ["A"]
} as const

export const SMBJ24A = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C123819"
  ]
}}
      manufacturerPartNumber="SMBJ24A"
      footprint="smdpads2_p4.7214mm_pw2.0475mm_ph2.1924mm_cyw7.2688mm_cyh4.1mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C123819.obj?uuid=892cc756ed79448ab4afad0e5bfcdfa6",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C123819.step?uuid=892cc756ed79448ab4afad0e5bfcdfa6",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.1 },
      }}
      {...props}
    />
  )
}