import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["A1"],
  pin2: ["A0"],
  pin3: ["Alert"],
  pin4: ["SDA"],
  pin5: ["SCL"],
  pin6: ["VS_POS"],
  pin7: ["GND"],
  pin8: ["VBUS"],
  pin9: ["VIN_NEG"],
  pin10: ["VIN_POS"]
} as const

const pinAttributes = {
  pin7: {requiresGround: true},
  pin8: {isInput: true},
  pin1: {isInput: true},
  pin2: {isInput: true},
  pin3: {isOutput: true, needsExternalPullup: true, canUseOpenDrain: true},
  pin4: {isBidirectional: true, capabilities: ["i2c_sda"], needsExternalPullup: true, canUseOpenDrain: true},
  pin5: {isInput: true, capabilities: ["i2c_scl"], needsExternalPullup: true},
  pin10: {isInput: true},
  pin9: {isInput: true},
  pin6: {requiresPower: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"}
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const INA226AIDGSR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C49851"
  ]
}}
      manufacturerPartNumber="INA226AIDGSR"
      footprint="dfn10_pillpads_p0.5mm_w5.84mm_pw0.28mm_pl1.62mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C49851.obj?uuid=a8ab40c7a7c54773a59b712bf86c7131",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C49851.step?uuid=a8ab40c7a7c54773a59b712bf86c7131",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}