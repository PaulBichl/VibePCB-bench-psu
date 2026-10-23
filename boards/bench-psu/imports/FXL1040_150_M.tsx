import type { InductorProps } from "@tscircuit/props"

export const FXL1040_150_M = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="15uH"
      supplierPartNumbers={{
  "jlcpcb": [
    "C475916"
  ]
}}
      manufacturerPartNumber="FXL1040-150-M"
      footprint="smdpads2_p10mm_pw3mm_ph3.5mm_cyw13.5mm_cyh10.5mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C475916.obj?uuid=c9be34aeb99c46b686c351584cef0ee5",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C475916.step?uuid=c9be34aeb99c46b686c351584cef0ee5",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012699999956566899, y: 0, z: -0.01 },
      }}
      {...props}
    />
  )
}