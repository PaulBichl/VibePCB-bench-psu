import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["CC1DB"],
  pin2: ["CC1"],
  pin3: ["NC"],
  pin4: ["CC2"],
  pin5: ["CC2DB"],
  pin6: ["RESET"],
  pin7: ["SCL"],
  pin8: ["SDA"],
  pin9: ["DISCH"],
  pin10: ["GND"],
  pin11: ["ATTACH"],
  pin12: ["ADDR0"],
  pin13: ["ADDR1"],
  pin14: ["POWER_OK3"],
  pin15: ["GPIO"],
  pin16: ["VBUS_EN_SNK"],
  pin17: ["A_B_SIDE"],
  pin18: ["VBUS_VS_DISCH"],
  pin19: ["ALERT"],
  pin20: ["POWER_OK2"],
  pin21: ["VREG_1V2"],
  pin22: ["VSYS"],
  pin23: ["VREG_2V7"],
  pin24: ["VDD"],
  pin25: ["EP"]
} as const

const pinAttributes = {
  pin3: {doNotConnect: true},
  pin10: {requiresGround: true},
  pin24: {requiresPower: true},
  pin1: {isBidirectional: true},
  pin2: {isBidirectional: true},
  pin4: {isBidirectional: true},
  pin5: {isBidirectional: true},
  pin6: {isInput: true},
  pin7: {isInput: true, capabilities: ["i2c_scl"], needsExternalPullup: true},
  pin8: {isBidirectional: true, capabilities: ["i2c_sda"], needsExternalPullup: true, canUseOpenDrain: true},
  pin9: {isBidirectional: true, canUseOpenDrain: true},
  pin11: {isOutput: true, needsExternalPullup: true, canUseOpenDrain: true},
  pin12: {isInput: true},
  pin13: {isInput: true},
  pin14: {isOutput: true, needsExternalPullup: true, canUseOpenDrain: true},
  pin15: {isOutput: true, needsExternalPullup: true, canUseOpenDrain: true},
  pin16: {isOutput: true, needsExternalPullup: true, canUseOpenDrain: true},
  pin17: {isOutput: true, needsExternalPullup: true, canUseOpenDrain: true},
  pin18: {isBidirectional: true},
  pin19: {isOutput: true, needsExternalPullup: true, canUseOpenDrain: true},
  pin20: {isOutput: true, needsExternalPullup: true, canUseOpenDrain: true},
  pin21: {isOutput: true, providesVoltage: "1.2V", shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "1uF"},
  pin22: {requiresPower: true},
  pin23: {isOutput: true, providesVoltage: "2.7V", shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "1uF"},
  pin25: {requiresGround: true}
} satisfies NonNullable<ChipProps["pinAttributes"]>

const footprinterPinLabels = {
  ...pinLabels,
  "pin25": [...pinLabels["pin25"], "thermalpad"],
} as const

export const STUSB4500QTR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={footprinterPinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2678061"
  ]
}}
      manufacturerPartNumber="STUSB4500QTR"
      footprint="qfn24_thermalpad2.8mmx2.8mm_pillpads_thermalpadcenteroffsety-0.015mm_h4.9mm_pw0.28mm_pl0.7mm_pin1location(bottomside,left)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2678061.obj?uuid=f4a3249710724deb990f62f343cd4553",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2678061.step?uuid=f4a3249710724deb990f62f343cd4553",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012699999842880061, y: -0.000012700000070253736, z: 0 },
      }}
      {...props}
    />
  )
}