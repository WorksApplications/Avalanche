// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { action } from "@storybook/addon-actions";
import { select, text, withKnobs } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";
import { HeatMapState } from "../../store";
import SnapshotList from "./SnapshotList";

const commonWrapStyle: React.CSSProperties = {
  width: "1400px",
  padding: "8px",
  backgroundColor: "#e3e6e8"
};

const N = 600 * 50;
const parabolaData = Array.from(
  new Array(N + 1),
  (v, i) => (N * N) / 4 - (N / 2 - i) * (N / 2 - i)
);
const sawData = Array.from(new Array(N + 1), (v, i) => (i % 500) / 10);

const statusSelection: { [key: string]: HeatMapState } = {
  "Empty (initial)": "empty",
  Loading: "loading",
  Loaded: "loaded",
  Failed: "failed"
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
  .add("1 snapshots", () => {
    const status = select("Status", statusSelection, "loading" as HeatMapState);
    return (
      <div style={commonWrapStyle}>
        <SnapshotList
          rows={[
            {
              uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
              createdAt: new Date(),
              environment: "jillk",
              podName: "ess-765c6ccfcd-9hrsv",
              link: "#",
              heatMap:
                status === "loaded"
                  ? {
                      maxValueOfData: 50,
                      maxValues: sawData,
                      meanValues: sawData.map(x => x / 2),
                      numColumns: sawData.length / 50,
                      numRows: 50
                    }
                  : undefined,
              getHeatMap: action(
                "getHeatMap of d7eec7c1-daf5-4198-9503-6957aea0bf90"
              ),
              heatMapStatus: status,
              heatMapId: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
              onRangeSelect: action("Selected")
            }
          ]}
        />
      </div>
    );
  })
  .add("3+ snapshots", () => {
    const status1 = select(
      "Status1",
      statusSelection,
      "loading" as HeatMapState
    );
    const status2 = select(
      "Status2",
      statusSelection,
      "loading" as HeatMapState
    );
    const status3 = select(
      "Status3",
      statusSelection,
      "loading" as HeatMapState
    );
    return (
      <div style={commonWrapStyle}>
        <SnapshotList
          rows={[
            {
              uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
              createdAt: new Date(),
              environment: "jillk",
              podName: "ess-765c6ccfcd-9hrsv",
              link: "#",
              heatMap:
                status1 === "loaded"
                  ? {
                      maxValueOfData: (N * N) / 4,
                      maxValues: parabolaData,
                      meanValues: parabolaData.map(x => x / 2),
                      numColumns: parabolaData.length / 50,
                      numRows: 50
                    }
                  : undefined,
              getHeatMap: action(
                "getHeatMap of d7eec7c1-daf5-4198-9503-6957aea0bf90"
              ),
              heatMapStatus: status1,
              heatMapId: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
              onRangeSelect: action("Selected")
            },
            {
              uuid: "e7eec7c1-daf5-4198-9503-6957aea0bf90",
              createdAt: new Date(),
              environment: "jillk",
              podName: "ess-765c6ccfcd-9hrsv",
              link: "#",
              heatMap:
                status2 === "loaded"
                  ? {
                      maxValueOfData: 50,
                      maxValues: sawData,
                      meanValues: sawData.map(x => x / 2),
                      numColumns: sawData.length / 50,
                      numRows: 50
                    }
                  : undefined,
              getHeatMap: action(
                "getHeatMap of e7eec7c1-daf5-4198-9503-6957aea0bf90"
              ),
              heatMapStatus: status2,
              heatMapId: "e7eec7c1-daf5-4198-9503-6957aea0bf90",
              onRangeSelect: action("Selected")
            },
            {
              uuid: "f7eec7c1-daf5-4198-9503-6957aea0bf90",
              createdAt: new Date(),
              environment: "jillk",
              podName: "ess-765c6ccfcd-9hrsv",
              link: "#",
              heatMap:
                status3 === "loaded"
                  ? {
                      maxValueOfData: 50,
                      maxValues: sawData,
                      meanValues: sawData.map(x => x / 2),
                      numColumns: sawData.length / 50,
                      numRows: 50
                    }
                  : undefined,
              getHeatMap: action(
                "getHeatMap of f7eec7c1-daf5-4198-9503-6957aea0bf90"
              ),
              heatMapStatus: status3,
              heatMapId: "f7eec7c1-daf5-4198-9503-6957aea0bf90",
              onRangeSelect: action("Selected")
            }
          ]}
        />
      </div>
    );
  });
