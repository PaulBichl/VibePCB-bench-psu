import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IN_POS"],
  pin2: ["IN_NEG"],
  pin3: ["GND"],
  pin4: ["VS"],
  pin5: ["SCL"],
  pin6: ["SDA"],
  pin7: ["A0"],
  pin8: ["A1"]
} as const

const pinAttributes = {
  pin3: {requiresGround: true},
  pin1: {isInput: true},
  pin2: {isInput: true},
  pin4: {requiresPower: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin8: {isInput: true},
  pin7: {isInput: true},
  pin6: {isBidirectional: true, capabilities: ["i2c_sda"], needsExternalPullup: true, canUseOpenDrain: true},
  pin5: {isInput: true, capabilities: ["i2c_scl"], needsExternalPullup: true}
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const INA219AIDCNR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C87469"
  ]
}}
      manufacturerPartNumber="INA219AIDCNR"
      footprint="dfn8_pillpads_p0.65mm_w3.7mm_pw0.36mm_pl1.25mm_pin1location(rightside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C87469.obj?uuid=7304035254c941188b587adb626783d8",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C87469.step?uuid=7304035254c941188b587adb626783d8",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0, y: -0.000012699999956566899, z: -0.049083 },
      }}
      {...props}
    />
  )
}