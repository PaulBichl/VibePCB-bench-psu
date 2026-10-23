import type { DiodeProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["cathode","neg"],
  pin2: ["anode","pos"]
} as const

const pinAttributes = {
  pin2: {isPassive: true},
  pin1: {isPassive: true}
} satisfies NonNullable<DiodeProps["pinAttributes"]>

export const A_1N4148W = (props: DiodeProps) => {
  const { name = "D1", ...restProps } = props

  return (
    <diode
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C81598"
  ]
}}
      manufacturerPartNumber="1N4148W"
      pinAttributes={pinAttributes}
      footprint={<footprint>
        <smtpad portHints={["pin2","anode","pos"]} pcbX="1.734947mm" pcbY="0mm" width="1.0999978mm" height="0.999998mm" shape="rect" />
<smtpad portHints={["pin1","cathode","neg"]} pcbX="-1.734947mm" pcbY="0mm" width="1.0999978mm" height="0.999998mm" shape="rect" />
<silkscreenpath route={[{"x":-1.3761720000001105,"y":-0.926337999999987},{"x":1.3762735999998768,"y":-0.926337999999987}]} />
<silkscreenpath route={[{"x":-1.3761720000001105,"y":0.9261348000001135},{"x":1.3762735999998768,"y":0.9261348000001135}]} />
<silkscreenpath route={[{"x":1.3762735999998768,"y":0.9261348000001135},{"x":1.3762735999998768,"y":0.7330948000001172}]} />
<silkscreenpath route={[{"x":1.3762735999998768,"y":-0.926337999999987},{"x":1.3762735999998768,"y":-0.733297999999877}]} />
<silkscreenpath route={[{"x":-0.9167368000000806,"y":0.876122200000168},{"x":-0.9167368000000806,"y":-0.8763254000000416}]} />
<silkscreentext text="{NAME}" pcbX="-0.007747mm" pcbY="1.9906mm" anchorAlignment="center" fontSize="1mm" />
<fabricationnotepath route={[{"x":-2.0319491999999855,"y":0.1268984000000728},{"x":-2.0319491999999855,"y":-0.06512559999998757},{"x":-1.2639548000000786,"y":-0.06512559999998757},{"x":-1.2639548000000786,"y":0.1268984000000728},{"x":-2.0319491999999855,"y":0.1268984000000728}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":2.0350480000000744,"y":0.09593580000012025},{"x":2.0350480000000744,"y":-0.09608819999994012},{"x":1.2670535999999402,"y":-0.09608819999994012},{"x":1.2670535999999402,"y":0.09593580000012025},{"x":2.0350480000000744,"y":0.09593580000012025}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":1.7470881999998937,"y":-0.3840988000000607},{"x":1.555064199999947,"y":-0.3840988000000607},{"x":1.555064199999947,"y":0.3838955999999598},{"x":1.7470881999998937,"y":0.3838955999999598},{"x":1.7470881999998937,"y":-0.3840988000000607}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-2.534945900000025,"y":1.0499984000000495},{"x":2.534945900000025,"y":1.0499984000000495},{"x":2.534945900000025,"y":-1.0499983999999358},{"x":-2.534945900000025,"y":-1.0499983999999358},{"x":-2.534945900000025,"y":1.0499984000000495}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C81598.obj?uuid=114f2449d65947c2a2476b7fb75383eb",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C81598.step?uuid=114f2449d65947c2a2476b7fb75383eb",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: 0 },
      }}
      {...restProps}
    />
  )
}