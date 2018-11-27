// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { action } from "@storybook/addon-actions";
import { storiesOf } from "@storybook/react";
import HeatLineChart from "./HeatLineChart";

const commonWrapStyle: React.CSSProperties = {
  width: "1400px",
  padding: "8px",
  backgroundColor: "white"
};

const N = 1200 * 4;
const proportionData = Array.from(new Array(N + 1), (v, i) => i / N);
const parabolaData = Array.from(
  new Array(N + 1),
  (v, i) => (N * N) / 4 - (N / 2 - i) * (N / 2 - i)
);
const sawData = Array.from(new Array(N + 1), (v, i) => i % 50);
const logisticMapPow256Raw = (() => {
  const ret = Array.from(new Array(N + 1)).map((v, i) => i / N);
  const a = 4;
  ret[0] = 0.1; // x_0
  for (let i = 1; i < ret.length; i++) {
    ret[i] = a * ret[i - 1] * (1 - ret[i - 1]);
  }
  return ret.map(x => Math.pow(x, 256));
})();

storiesOf("HeatLineChart", module)
  .add("Empty", () => (
    <div style={commonWrapStyle}>
      <HeatLineChart
        hash="1"
        maxValueOfData={0}
        meanValues={[]}
        maxValues={[]}
        numColumns={0}
        numRows={0}
        onRangeSelect={action("Selected")}
      />
    </div>
  ))
  .add("Proportion data", () => (
    <div style={commonWrapStyle}>
      <HeatLineChart
        hash="1"
        maxValueOfData={1}
        maxValues={proportionData}
        meanValues={proportionData.map(x => (x * 3) / 4)}
        numColumns={proportionData.length / 50}
        numRows={50}
        onRangeSelect={action("Selected")}
      />
    </div>
  ))
  .add("Parabola data", () => (
    <div style={commonWrapStyle}>
      <HeatLineChart
        hash="1"
        maxValueOfData={(N * N) / 4}
        maxValues={parabolaData}
        meanValues={parabolaData.map(x => (x * 3) / 4)}
        numColumns={parabolaData.length / 50}
        numRows={50}
        onRangeSelect={action("Selected")}
      />
    </div>
  ))
  .add("Saw data", () => (
    <div style={commonWrapStyle}>
      <HeatLineChart
        hash="1"
        maxValueOfData={50}
        maxValues={sawData}
        meanValues={sawData.map(x => (x * 3) / 4)}
        numColumns={sawData.length / 50}
        numRows={50}
        onRangeSelect={action("Selected")}
      />
    </div>
  ))
  .add("Logistic Map ^ 256 data", () => (
    <div style={commonWrapStyle}>
      <HeatLineChart
        hash="1"
        maxValueOfData={1}
        maxValues={logisticMapPow256Raw}
        meanValues={logisticMapPow256Raw.map(x => (x * 3) / 4)}
        numColumns={logisticMapPow256Raw.length / 50}
        numRows={50}
        onRangeSelect={action("Selected")}
      />
    </div>
  ));
