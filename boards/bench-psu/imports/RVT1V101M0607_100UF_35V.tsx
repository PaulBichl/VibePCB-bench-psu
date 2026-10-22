import type { CapacitorProps } from "@tscircuit/props"

export const RVT1V101M0607_100UF_35V = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="100uF"
      polarized
      supplierPartNumbers={{
  "jlcpcb": [
    "C970686"
  ]
}}
      manufacturerPartNumber="RVT1V101M0607 100UF 35V"
      footprint="cap_p5.3398mm_pw3.5mm_ph1.2mm_cyw9.3398mm_cyh7.1mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C970686.obj?uuid=4098ac4942764b88998acce28312dfd8",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C970686.step?uuid=4098ac4942764b88998acce28312dfd8",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0.00005080000016732811, y: 0.00012700000002041634, z: -0.02 },
      }}
      {...restProps}
    />
  )
}