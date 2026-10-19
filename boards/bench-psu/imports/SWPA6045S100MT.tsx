import type { InductorProps } from "@tscircuit/props"

export const SWPA6045S100MT = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="10uH"
      supplierPartNumbers={{
  "jlcpcb": [
    "C79272"
  ]
}}
      manufacturerPartNumber="SWPA6045S100MT"
      footprint="smdpads2_p5.206mm_pw2.474mm_ph5.02mm_cyw8.18mm_cyh6.5mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C79272.obj?uuid=38d40b1b5688411c9194395505ca5302",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C79272.step?uuid=38d40b1b5688411c9194395505ca5302",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: -0.000025400000026820635, y: -0.000025399999913133797, z: -0.01 },
      }}
      {...props}
    />
  )
}