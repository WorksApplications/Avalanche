// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { storiesOf } from "@storybook/react";
import HeatMap from "./HeatMap";

const commonWrapStyle: React.CSSProperties = {
  padding: "8px",
  backgroundColor: "#e6e8ea"
};

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
  ));
