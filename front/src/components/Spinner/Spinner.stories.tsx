// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { storiesOf } from "@storybook/react";
import Spinner from "./Spinner";

const commonWrapStyle: React.CSSProperties = {
  width: "20px",
  padding: "8px",
  backgroundColor: "#e6e8ea"
};

storiesOf("Spinner", module)
  .add("Small", () => (
    <div style={commonWrapStyle}>
      <Spinner />
    </div>
  ))
  .add("Bigger", () => (
    <div style={{ ...commonWrapStyle, width: "60px" }}>
      <Spinner />
    </div>
  ));
