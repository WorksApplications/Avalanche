// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { text, withKnobs } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";
import SnapshotList from "./SnapshotList";

const commonWrapStyle: React.CSSProperties = {
  width: "1200px",
  padding: "8px",
  backgroundColor: "#e6e8ea"
};

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
            link: "#"
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
            link: "#"
          },
          {
            uuid: "e7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            environment: "jillk",
            podName: "ess-765c6ccfcd-9hrsv",
            link: "#"
          },
          {
            uuid: "f7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            environment: "jillk",
            podName: "ess-765c6ccfcd-9hrsv",
            link: "#"
          }
        ]}
      />
    </div>
  ));
