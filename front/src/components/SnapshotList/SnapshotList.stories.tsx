/*
 * Copyright (c) 2017 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { action } from "@storybook/addon-actions";
import { select, text, withKnobs } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";
import { DataState, IPerfCallTreeData } from "../../store";
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

const statusSelection: { [key: string]: DataState } = {
  "Empty (initial)": "empty",
  Loading: "loading",
  Loaded: "loaded",
  Failed: "failed"
};

const perfCallTree: IPerfCallTreeData = [
  {
    id: 0,
    label: "root",
    childIds: [1, 3],
    relativeRatio: 1.0,
    immediateRatio: 0.05,
    totalRatio: 1.0,
    hasCode: true,
    code: [["final var value = model.getValue();"], ["return value * value;"]]
  },
  {
    id: 1,
    label: "big",
    childIds: [2],
    parentId: 0,
    relativeRatio: 0.7,
    immediateRatio: 1.0,
    totalRatio: 0.7,
    hasCode: true,
    code: [["public int getValue() {"], ["    return this.value;"], ["}"]]
  },
  {
    id: 2,
    label: "sub",
    childIds: [],
    parentId: 1,
    relativeRatio: 1.0,
    immediateRatio: 1.0,
    totalRatio: 0.7,
    hasCode: false,
    code: []
  },
  {
    id: 3,
    label: "small",
    childIds: [],
    parentId: 0,
    relativeRatio: 0.25,
    immediateRatio: 1.0,
    totalRatio: 0.25,
    hasCode: false,
    code: []
  }
];

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
    const heatMapStatus = select(
      "HeatMap Status",
      statusSelection,
      "loading" as DataState
    );
    const perfCallTreeStatus = select(
      "PerfCallTree Status",
      statusSelection,
      "loading" as DataState
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
                heatMapStatus === "loaded"
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
              heatMapStatus,
              heatMapId: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
              perfCallTreeStatus,
              perfCallTree,
              onRangeSelect: action("Selected")
            }
          ]}
        />
      </div>
    );
  })
  .add("3+ snapshots", () => {
    const heatMapStatus1 = select(
      "HeatMap Status[1]",
      statusSelection,
      "loading" as DataState
    );
    const heatMapStatus2 = select(
      "HeatMap Status[2]",
      statusSelection,
      "loading" as DataState
    );
    const heatMapStatus3 = select(
      "HeatMap Status[3]",
      statusSelection,
      "loading" as DataState
    );
    const perfCallTreeStatus1 = select(
      "PerfCallTree Status[1]",
      statusSelection,
      "loading" as DataState
    );
    const perfCallTreeStatus2 = select(
      "PerfCallTree Status[2]",
      statusSelection,
      "loading" as DataState
    );
    const perfCallTreeStatus3 = select(
      "PerfCallTree Status[3]",
      statusSelection,
      "loading" as DataState
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
                heatMapStatus1 === "loaded"
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
              heatMapStatus: heatMapStatus1,
              heatMapId: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
              perfCallTreeStatus: perfCallTreeStatus1,
              perfCallTree,
              onRangeSelect: action("Selected")
            },
            {
              uuid: "e7eec7c1-daf5-4198-9503-6957aea0bf90",
              createdAt: new Date(),
              environment: "jillk",
              podName: "ess-765c6ccfcd-9hrsv",
              link: "#",
              heatMap:
                heatMapStatus2 === "loaded"
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
              heatMapStatus: heatMapStatus2,
              heatMapId: "e7eec7c1-daf5-4198-9503-6957aea0bf90",
              perfCallTreeStatus: perfCallTreeStatus2,
              perfCallTree,
              onRangeSelect: action("Selected")
            },
            {
              uuid: "f7eec7c1-daf5-4198-9503-6957aea0bf90",
              createdAt: new Date(),
              environment: "jillk",
              podName: "ess-765c6ccfcd-9hrsv",
              link: "#",
              heatMap:
                heatMapStatus3 === "loaded"
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
              heatMapStatus: heatMapStatus3,
              heatMapId: "f7eec7c1-daf5-4198-9503-6957aea0bf90",
              perfCallTreeStatus: perfCallTreeStatus3,
              perfCallTree,
              onRangeSelect: action("Selected")
            }
          ]}
        />
      </div>
    );
  });
