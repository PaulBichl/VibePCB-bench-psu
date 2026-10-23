import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["K1"],
  pin2: ["K2"],
  pin3: ["A"]
} as const

export const ESDA25W = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
supplierPartNumbers={{
  "jlcpcb": [
    "C2935152"
  ]
}}
      manufacturerPartNumber="ESDA25W"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="0.842518mm" pcbY="-0.659892mm" width="0.8349996mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="0.842518mm" pcbY="0.659892mm" width="0.8349996mm" height="0.499999mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="-0.842518mm" pcbY="0mm" width="0.8349996mm" height="0.499999mm" shape="rect" />
<silkscreenpath route={[{"x":-0.7011924000000107,"y":0.4301490000000001},{"x":-0.7011924000000107,"y":0.9043923999999777}]} />
<silkscreenpath route={[{"x":-0.7011924000000107,"y":-1.126185200000009},{"x":-0.7011924000000107,"y":-0.4301490000000143}]} />
<silkscreenpath route={[{"x":0.7012685999999917,"y":-1.0900410000000136},{"x":0.7012685999999917,"y":-1.126185200000009}]} />
<silkscreenpath route={[{"x":0.7012685999999917,"y":0.22974299999999914},{"x":0.7012685999999917,"y":-0.22974300000001335}]} />
<silkscreenpath route={[{"x":0.7012685999999917,"y":1.1261343999999838},{"x":0.7012685999999917,"y":1.0900409999999852}]} />
<silkscreenpath route={[{"x":0.7011923999999823,"y":-1.126185200000009},{"x":-0.7011924000000107,"y":-1.126185200000009}]} />
<silkscreenpath route={[{"x":0.7012685999999917,"y":1.1261343999999838},{"x":-0.7013194000000027,"y":1.1261343999999838},{"x":-0.7013194000000027,"y":0.9043923999999777}]} />
<silkscreencircle pcbX="0.9100058mm" pcbY="-1.1800078mm" radius="0.07493mm" />
<silkscreentext text="{NAME}" pcbX="-0.0101854mm" pcbY="2.1383264mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-1.5100178000000142,"y":1.2499979999999766},{"x":1.5100178,"y":1.2499979999999766},{"x":1.5100178,"y":-1.249998000000005},{"x":-1.5100178000000142,"y":-1.249998000000005},{"x":-1.5100178000000142,"y":1.2499979999999766}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2935152.obj?uuid=788b28f834c14551a13b5249c70c550d",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2935152.step?uuid=788b28f834c14551a13b5249c70c550d",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: -0.000012700000013410317, z: -0.075 },
      }}
      {...props}
    />
  )
}