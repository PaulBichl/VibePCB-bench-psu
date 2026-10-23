import type { PushButtonProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"]
} as const

export const B3F_4055 = (props: PushButtonProps<typeof pinLabels>) => {
  const { name = "SW1", ...restProps } = props

  return (
    <pushbutton
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C84931"
  ]
}}
      manufacturerPartNumber="B3F-4055"
      footprint={<footprint>
        <hole pcbX="0mm" pcbY="4.499991mm" diameter="1.7999964mm" />
<hole pcbX="0mm" pcbY="-4.499991mm" diameter="1.7999964mm" />
<platedhole  portHints={["pin1"]} pcbX="6.249924mm" pcbY="-2.499995mm" outerDiameter="1.999996mm" holeDiameter="1.3000228mm" shape="circle" />
<platedhole  portHints={["pin2"]} pcbX="-6.249924mm" pcbY="-2.499995mm" outerDiameter="1.999996mm" holeDiameter="1.3000228mm" shape="circle" />
<platedhole  portHints={["pin3"]} pcbX="6.249924mm" pcbY="2.499995mm" outerDiameter="1.999996mm" holeDiameter="1.3000228mm" shape="circle" />
<platedhole  portHints={["pin4"]} pcbX="-6.249924mm" pcbY="2.499995mm" outerDiameter="1.999996mm" holeDiameter="1.3000228mm" shape="circle" />
<silkscreenpath route={[{"x":0.01016000000001327,"y":-1.9973289999999935},{"x":0.01016000000001327,"y":-0.9973309999999884},{"x":1.5102840000000128,"y":0.5025389999999987}]} />
<silkscreenpath route={[{"x":0.01016000000001327,"y":1.0026649999999933},{"x":0.01016000000001327,"y":2.0026629999999983}]} />
<silkscreenpath route={[{"x":-0.48971199999998305,"y":2.0026629999999983},{"x":0.5102860000000078,"y":2.0026629999999983}]} />
<silkscreenpath route={[{"x":-0.48971199999998305,"y":-1.9973289999999935},{"x":0.5102860000000078,"y":-1.9973289999999935}]} />
<silkscreenpath route={[{"x":-5.989827999999989,"y":3.7573203999999976},{"x":-5.989827999999989,"y":6.00265499999999}]} />
<silkscreenpath route={[{"x":-5.989827999999989,"y":6.00265499999999},{"x":6.010148000000015,"y":6.00265499999999}]} />
<silkscreenpath route={[{"x":6.010148000000015,"y":6.00265499999999},{"x":6.010148000000015,"y":3.719677599999997}]} />
<silkscreenpath route={[{"x":6.010148000000015,"y":1.226845400000002},{"x":6.010148000000015,"y":-1.2439141999999919}]} />
<silkscreenpath route={[{"x":6.010148000000015,"y":-3.7305233999999956},{"x":6.010148000000015,"y":-5.9973209999999995}]} />
<silkscreenpath route={[{"x":6.010148000000015,"y":-5.9973209999999995},{"x":-5.989827999999989,"y":-5.9973209999999995}]} />
<silkscreenpath route={[{"x":-5.989827999999989,"y":-5.9973209999999995},{"x":-5.989827999999989,"y":-3.7314124000000106}]} />
<silkscreenpath route={[{"x":-5.989827999999989,"y":1.259535200000002},{"x":-5.989827999999989,"y":-1.2871449999999953}]} />
<silkscreentext text="{NAME}" pcbX="-0.00254mm" pcbY="7.002147mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-7.499921999999998,"y":6.253112200000004},{"x":7.499922000000012,"y":6.253112200000004},{"x":7.499922000000012,"y":-6.246863799999986},{"x":-7.499921999999998,"y":-6.246863799999986},{"x":-7.499921999999998,"y":6.253112200000004}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C84931.obj?uuid=ca13360db5d54550a11550852a0f41e8",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C84931.step?uuid=ca13360db5d54550a11550852a0f41e8",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012699999984988608, y: -0.00312420000000202, z: -0.21967360000000058 },
      }}
      {...restProps}
    />
  )
}