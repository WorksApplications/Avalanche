// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { action } from "@storybook/addon-actions";
import { boolean, text, withKnobs } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";
import SnapshotList from "./SnapshotList";

const commonWrapStyle: React.CSSProperties = {
  width: "1200px",
  padding: "8px",
  backgroundColor: "#e6e8ea"
};

const N = 600 * 50;
const parabolaData = Array.from(
  new Array(N + 1),
  (v, i) => (N * N) / 4 - (N / 2 - i) * (N / 2 - i)
);
const sawData = Array.from(new Array(N + 1), (v, i) => (i % 500) / 10);

storiesOf("SnapshotList", module)
  .addDecorator(withKnobs)
  .add("No snapshots", () => (
    <div style={commonWrapStyle}>
      <SnapshotList
        rows={[]}
        emptyMessage={text("No data message", "No snapshots")}
      />
    </div>
  ))
  .add("1 snapshots", () => (
    <div style={commonWrapStyle}>
      <SnapshotList
        rows={[
          {
            uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            environment: "jillk",
            podName: "ess-765c6ccfcd-9hrsv",
            link: "#",
            heatMap: boolean("loading", true)
              ? undefined
              : {
                  values: sawData,
                  maxValue: 50
                },
            getHeatMap: action(
              "getHeatMap of d7eec7c1-daf5-4198-9503-6957aea0bf90"
            )
          }
        ]}
      />
    </div>
  ))
  .add("3+ snapshots", () => (
    <div style={commonWrapStyle}>
      <SnapshotList
        rows={[
          {
            uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            environment: "jillk",
            podName: "ess-765c6ccfcd-9hrsv",
            link: "#",
            heatMap: boolean("loading1", true)
              ? undefined
              : {
                  values: parabolaData,
                  maxValue: (N * N) / 4
                },
            getHeatMap: action(
              "getHeatMap of d7eec7c1-daf5-4198-9503-6957aea0bf90"
            )
          },
          {
            uuid: "e7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            environment: "jillk",
            podName: "ess-765c6ccfcd-9hrsv",
            link: "#",
            heatMap: boolean("loading2", true)
              ? undefined
              : {
                  values: sawData,
                  maxValue: 50
                },
            getHeatMap: action(
              "getHeatMap of e7eec7c1-daf5-4198-9503-6957aea0bf90"
            )
          },
          {
            uuid: "f7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            environment: "jillk",
            podName: "ess-765c6ccfcd-9hrsv",
            link: "#",
            heatMap: boolean("loading3", true)
              ? undefined
              : {
                  values: sawData,
                  maxValue: 50
                },
            getHeatMap: action(
              "getHeatMap of f7eec7c1-daf5-4198-9503-6957aea0bf90"
            )
          }
        ]}
      />
    </div>
  ));
