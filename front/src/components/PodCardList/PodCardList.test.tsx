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
// tslint:disable:no-submodule-imports no-implicit-dependencies
import "jest-dom/extend-expect";
import * as React from "react";
import { render } from "react-testing-library";
import "react-testing-library/cleanup-after-each";
import { IProperty as PodCardListProperty, PodCardList } from "./PodCardList";

const baseDateValue = Date.now();

const basicListProps: PodCardListProperty = {
  kind: "all",
  data: [
    {
      id: "ess-765c6ccfcd-9hrsv",
      isAlive: true,
      isSaving: false,
      app: "ess",
      environment: "jillk",
      name: "ess-765c6ccfcd-9hrsv",
      createdAt: new Date(baseDateValue),
      // upper data is newer
      snapshots: [
        {
          uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
          createdAt: new Date(baseDateValue + 10000),
          link:
            "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90"
        },
        {
          uuid: "e7eec7c1-daf5-4198-9503-6957aea0bf90",
          createdAt: new Date(baseDateValue + 8000),
          link:
            "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fe7eec7c1-daf5-4198-9503-6957aea0bf90"
        },
        {
          uuid: "f7eec7c1-daf5-4198-9503-6957aea0bf90",
          createdAt: new Date(baseDateValue + 6000),
          link:
            "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Ff7eec7c1-daf5-4198-9503-6957aea0bf90"
        },
        {
          uuid: "g7eec7c1-daf5-4198-9503-6957aea0bf90",
          createdAt: new Date(baseDateValue + 4000),
          link:
            "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fg7eec7c1-daf5-4198-9503-6957aea0bf90"
        }
      ],
      onSaveButtonClick: undefined
    }
  ]
};

describe("<PodCardList />", () => {
  it("renders itself", () => {
    const { getByTestId } = render(<PodCardList {...basicListProps} />);
    expect(getByTestId("root")).not.toBeNull();
  });

  it("renders list if there are card data", () => {
    const { queryByTestId } = render(<PodCardList {...basicListProps} />);
    expect(queryByTestId("card-list")).not.toBeNull();
    expect(queryByTestId("empty-message")).toBeNull();
  });

  it("renders empty message if there are no card data", () => {
    const { queryByTestId } = render(
      <PodCardList {...basicListProps} data={[]} />
    );
    expect(queryByTestId("card-list")).toBeNull();
    expect(queryByTestId("empty-message")).not.toBeNull();
  });
});
