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
// tslint:disable:no-implicit-dependencies
import * as fetchMock from "jest-fetch-mock";
import heatMapClient from "./heatMapClient";

// @ts-ignore
global.fetch = fetchMock.default;

describe("HeatMapClient", () => {
  it("returns empty array with empty data", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ columns: [], rows: [], maxvalue: 0, values: [] })
    );
    await expect(heatMapClient("")).resolves.toEqual({
      maxValue: 0,
      values: [],
      numColumns: 0,
      numRows: 0
    });
  });
  describe("keeps `len(columns)` === `len(values)` and `len(rows)` === `len(values[x})", async () => {
    it("okay when 1 column, 1 row and 1 value array", async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          columns: [1],
          rows: [90],
          maxvalue: 2,
          values: [[2]]
        })
      );
      await expect(heatMapClient("")).resolves.toEqual({
        maxValue: 2,
        values: [2],
        numColumns: 1,
        numRows: 1
      });
    });
    it("okay when 2 columns, 2 rows and 2 value arrays", async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          columns: [1, 2],
          rows: [90, 80],
          maxvalue: 6,
          values: [[3, 4], [5, 6]]
        })
      );
      await expect(heatMapClient("")).resolves.toEqual({
        maxValue: 6,
        values: [3, 4, 5, 6],
        numColumns: 2,
        numRows: 2
      });
    });
  });

  it("handles failure with `{}`", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({}));
    await expect(heatMapClient("")).rejects.toThrowError("Invalid data");
  });

  it("handles fetch error", async () => {
    fetchMock.mockResponseOnce(JSON.stringify("fail"), {
      status: 404
    });
    await expect(heatMapClient("")).rejects.toThrowError("Failed to get");
  });
});
