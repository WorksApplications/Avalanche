/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
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
// tslint:disable:no-submodule-imports no-implicit-dependencies
import "jest-dom/extend-expect";
import * as React from "react";
import { render } from "react-testing-library";
import "react-testing-library/cleanup-after-each";
import { IItemProperty as SnapshotData, SnapshotList } from "./SnapshotList";

const baseDateValue = Date.now();

const basicListProps: SnapshotData[] = [
  {
    uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
    createdAt: new Date(baseDateValue + 10000),
    link: "#",
    environment: "jillk",
    podName: "ess-765c6ccfcd-9hrsv",
    getHeatMap: jest.fn()
  },
  {
    uuid: "e7eec7c1-daf5-4198-9503-6957aea0bf90",
    createdAt: new Date(baseDateValue + 8000),
    link: "#",
    environment: "jillk",
    podName: "ess-865c6ccfcd-9hrsv",
    getHeatMap: jest.fn()
  },
  {
    uuid: "f7eec7c1-daf5-4198-9503-6957aea0bf90",
    createdAt: new Date(baseDateValue + 6000),
    link: "#",
    environment: "jillk",
    podName: "ess-965c6ccfcd-9hrsv",
    getHeatMap: jest.fn()
  }
];

describe("<SnapshotListList />", () => {
  it("renders itself", () => {
    const { getByTestId } = render(<SnapshotList rows={basicListProps} />);
    expect(getByTestId("root")).not.toBeNull();
  });

  it("renders list if there are snapshot data", () => {
    const { queryAllByTestId } = render(<SnapshotList rows={basicListProps} />);
    expect(queryAllByTestId("snapshot")).toHaveLength(3);
    expect(queryAllByTestId("empty-message")).toHaveLength(0);
  });

  it("renders empty message if there are no card data", () => {
    const { queryAllByTestId } = render(
      <SnapshotList emptyMessage="No snapshots" rows={[]} />
    );
    expect(queryAllByTestId("snapshot")).toHaveLength(0);
    expect(queryAllByTestId("empty-message")).toHaveLength(1);
  });
});
