// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { action } from "@storybook/addon-actions";
import { boolean, withKnobs } from "@storybook/addon-knobs/react";
import { storiesOf } from "@storybook/react";
import "../containers/App.scss";
import "../wapicon/style.css";
import PodCard from "./PodCard";

const commonWrapStyle: React.CSSProperties = {
  display: "flex",
  width: "400px",
  padding: "8px",
  backgroundColor: "#e6e8ea",
  justifyContent: "center",
  alignContent: "center"
};

storiesOf("PodCard", module)
  .addDecorator(withKnobs)
  .add("No snapshots", () => (
    <div style={commonWrapStyle}>
      <PodCard
        isAlive={boolean("Is alive", true)}
        isSaving={boolean("Is saving", false)}
        app="ess"
        environment="jillk"
        name="ess-765c6ccfcd-9hrsv"
        createdAt={new Date()}
        snapshots={[]}
        onSaveButtonClick={
          boolean("Can take snaphost", true) ? action("Saved!") : undefined
        }
      />
    </div>
  ))
  .add("1 snapshot", () => (
    <div style={commonWrapStyle}>
      <PodCard
        isAlive={boolean("Is alive", true)}
        isSaving={boolean("Is saving", false)}
        app="ess"
        environment="jillk"
        name="ess-765c6ccfcd-9hrsv"
        createdAt={new Date()}
        snapshots={[
          {
            uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            link:
              "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90"
          }
        ]}
        onSaveButtonClick={
          boolean("Can take snaphost", true) ? action("Saved!") : undefined
        }
      />
    </div>
  ))
  .add("3 snapshots", () => (
    <div style={commonWrapStyle}>
      <PodCard
        isAlive={boolean("Is alive", true)}
        isSaving={boolean("Is saving", false)}
        app="ess"
        environment="jillk"
        name="ess-765c6ccfcd-9hrsv"
        createdAt={new Date()}
        snapshots={[
          {
            uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            link:
              "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90"
          },
          {
            uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            link:
              "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90"
          },
          {
            uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            link:
              "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90"
          }
        ]}
        onSaveButtonClick={
          boolean("Can take snaphost", true) ? action("Saved!") : undefined
        }
      />
    </div>
  ));