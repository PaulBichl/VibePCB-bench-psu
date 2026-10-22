import type { InductorProps } from "@tscircuit/props"

export const FXL1040_100_M = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="10uH"
      supplierPartNumbers={{
  "jlcpcb": [
    "C475915"
  ]
}}
      manufacturerPartNumber="FXL1040-100-M"
      footprint="smdpads2_p10mm_pw3mm_ph3.5mm_cyw13.5mm_cyh10.5mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C475915.obj?uuid=c9be34aeb99c46b686c351584cef0ee5",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C475915.step?uuid=c9be34aeb99c46b686c351584cef0ee5",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012699999956566899, y: 0, z: -0.01 },
      }}
      {...props}
    />
  )
}