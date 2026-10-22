import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["PGND"],
  pin2: ["VIN"],
  pin3: ["EN"],
  pin4: ["PG"],
  pin5: ["FB"],
  pin6: ["VCC"],
  pin7: ["BOOT"],
  pin8: ["SW"],
  pin9: ["EP"]
} as const

const pinAttributes = {
  pin1: {capabilities: [], requiresGround: true, requiresVoltage: 0, mustBeConnected: true},
  pin2: {isInput: true, capabilities: [], requiresPower: true, mustBeConnected: true, shouldHaveDecouplingCapacitor: true},
  pin6: {isOutput: true, capabilities: [], providesPower: true, shouldHaveDecouplingCapacitor: true, recommendedDecouplingCapacitorCapacitance: "1uF"},
  pin3: {isInput: true, capabilities: [], mustBeConnected: true},
  pin4: {isOutput: true, capabilities: [], needsExternalPullup: true, canUseOpenDrain: true},
  pin5: {isInput: true, capabilities: [], mustBeConnected: true},
  pin7: {isInput: true, capabilities: []},
  pin8: {isOutput: true, capabilities: [], providesPower: true}
} satisfies NonNullable<ChipProps["pinAttributes"]>

const footprinterPinLabels = {
  ...pinLabels,
  "pin9": [...pinLabels["pin9"], "thermalpad"],
} as const

export const LMR33630ADDAR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={footprinterPinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C841384"
  ]
}}
      manufacturerPartNumber="LMR33630ADDAR"
      footprint="dfn8_thermalpad2.5mmx3.5mm_w6.7mm_pl1.3mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C841384.obj?uuid=f5377fc2ccbb41ff8aa998b5ab8a4f05",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C841384.step?uuid=f5377fc2ccbb41ff8aa998b5ab8a4f05",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.000012700000013410317, z: -0.825 },
      }}
      {...props}
    />
  )
}