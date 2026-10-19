import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["I1","O11"],
  pin2: ["GND"],
  pin3: ["I2","O21"],
  pin4: ["I3","O22"],
  pin5: ["VBUS"],
  pin6: ["I4","O12"]
} as const

const pinAttributes = {
  pin2: {requiresGround: true, mustBeConnected: true},
  pin5: {isPassive: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "100nF"},
  pin1: {isPassive: true},
  pin3: {isPassive: true},
  pin4: {isPassive: true},
  pin6: {isPassive: true}
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const USBLC6_2SC6 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2687116"
  ]
}}
      manufacturerPartNumber="USBLC6-2SC6"
      footprint="dfn6_p0.95mm_w3.3702mm_pw0.532mm_pl1.072mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2687116.obj?uuid=229b69761e2c45dba6a83d8866dec72d",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2687116.step?uuid=229b69761e2c45dba6a83d8866dec72d",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: -0.000012700000070253736, y: 0.000012700000070253736, z: -0.048939 },
      }}
      {...props}
    />
  )
}