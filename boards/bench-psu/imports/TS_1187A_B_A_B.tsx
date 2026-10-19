import type { PushButtonProps } from "@tscircuit/props"

// Datasheet (XKB TS-1187A-X-X-X): terminals A-B are joined inside the part, as are C-D;
// pressing connects A/B to C/D. So the 2-pin switch is pin1 = pads A+B, pin2 = pads C+D.
// (The imported 4-pin version let the generic 2-pin symbol treat A and B as the contacts.)
const pinLabels = {
  pin1: ["AB"],
  pin2: ["CD"]
} as const

export const TS_1187A_B_A_B = (props: PushButtonProps<typeof pinLabels>) => {
  const { name = "SW1", ...restProps } = props

  return (
    <pushbutton
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C318884"
  ]
}}
      manufacturerPartNumber="TS-1187A-B-A-B"
      footprint={
        // datasheet P.C.B LAYOUT: pads 1.0 x 0.75 mm, 7.0 / 5.0 mm outer / inner span in x,
        // 4.5 / 3.0 mm in y -> centres at (+-3, +-1.875); A top-left, B top-right, C/D below
        <footprint>
          <smtpad portHints={["pin1"]} pcbX="-3mm" pcbY="1.875mm" width="1mm" height="0.75mm" shape="rect" />
          <smtpad portHints={["pin1"]} pcbX="3mm" pcbY="1.875mm" width="1mm" height="0.75mm" shape="rect" />
          <smtpad portHints={["pin2"]} pcbX="-3mm" pcbY="-1.875mm" width="1mm" height="0.75mm" shape="rect" />
          <smtpad portHints={["pin2"]} pcbX="3mm" pcbY="-1.875mm" width="1mm" height="0.75mm" shape="rect" />
          <silkscreenrect pcbX="0mm" pcbY="0mm" width="5.3mm" height="5.3mm" />
          <courtyardrect pcbX={0} pcbY={0} width={7.5} height={5.6} strokeWidth={0.05} />
        </footprint>
      }
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C318884.obj?uuid=91b67c1735f643ffb2e7226c23dd3492",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C318884.step?uuid=91b67c1735f643ffb2e7226c23dd3492",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012700000070253736, y: 0.0004999999999999449, z: -0.05 },
      }}
      {...restProps}
    />
  )
}