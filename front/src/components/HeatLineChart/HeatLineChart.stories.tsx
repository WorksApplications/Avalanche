// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { storiesOf } from "@storybook/react";
import HeatMap from "./HeatLineChart";

const commonWrapStyle: React.CSSProperties = {
  width: "1200px",
  padding: "8px",
  backgroundColor: "white"
};

const N = 600 * 50;
const parabolaData = Array.from(
  new Array(N + 1),
  (v, i) => (N * N) / 4 - (N / 2 - i) * (N / 2 - i)
);
const sawData = Array.from(new Array(N + 1), (v, i) => (i % 500) / 10);

storiesOf("HeatMap", module)
  .add("Empty", () => (
    <div style={commonWrapStyle}>
      <HeatMap hash="1" maxValue={0} values={[]} />
    </div>
  ))
  .add("Proportion data", () => (
    <div style={commonWrapStyle}>
      <HeatMap hash="1" maxValue={3} values={[0, 1, 2, 3]} />
    </div>
  ))
  .add("Parabola data", () => (
    <div style={commonWrapStyle}>
      <HeatMap hash="1" maxValue={(N * N) / 4} values={parabolaData} />
    </div>
  ))
  .add("Saw data", () => (
    <div style={commonWrapStyle}>
      <HeatMap hash="1" maxValue={50} values={sawData} />
    </div>
  ));
