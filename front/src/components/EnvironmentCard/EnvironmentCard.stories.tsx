// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { action } from "@storybook/addon-actions";
import { select, withKnobs } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";
import * as ReactTooltip from "react-tooltip";
import "../../App.scss";
import EnvironmentCard from "./EnvironmentCard";

const commonWrapStyle: React.CSSProperties = {
  display: "flex",
  width: "360px",
  padding: "8px",
  backgroundColor: "#e3e6e8",
  justifyContent: "center",
  alignContent: "center"
};

const options = {
  unconfigured: "unconfigured",
  configured: "configured",
  observed: "observed"
};

storiesOf("EnvironmentCard", module)
  .addDecorator(withKnobs)
  .add("No snapshots", () => (
    <div style={commonWrapStyle}>
      <EnvironmentCard
        name="systema"
        kind={select("Kind", options, "unconfigured")}
        version="18.06-"
        onEdit={action("Start editing")}
      />
      <ReactTooltip effect="solid" place="top" aria-haspopup="true" />
    </div>
  ));
