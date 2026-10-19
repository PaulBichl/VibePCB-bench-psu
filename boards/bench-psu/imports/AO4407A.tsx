import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["S1"],
  pin2: ["S2"],
  pin3: ["S3"],
  pin4: ["G"],
  pin5: ["D4"],
  pin6: ["D3"],
  pin7: ["D2"],
  pin8: ["D1"]
} as const

const pinAttributes = {
  pin1: {isPassive: true},
  pin2: {isPassive: true},
  pin3: {isPassive: true},
  pin4: {isInput: true},
  pin8: {isPassive: true},
  pin7: {isPassive: true},
  pin6: {isPassive: true},
  pin5: {isPassive: true}
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const AO4407A = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2841482"
  ]
}}
      manufacturerPartNumber="AO4407A"
      footprint="ms012_pillpads_w3.5mm_pw0.57mm_pl2.04mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2841482.obj?uuid=765d86d522014712af5a26ea59477fa9",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2841482.step?uuid=765d86d522014712af5a26ea59477fa9",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: 0, z: 0.1 },
      }}
      {...props}
    />
  )
}