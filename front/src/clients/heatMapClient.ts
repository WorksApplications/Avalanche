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
import { FLAMESCOPE_API_BASE } from "../constants";

export default function(fileName: string): Promise<IHeatMap> {
  const url = `${FLAMESCOPE_API_BASE}/heatmap/?filename=${fileName}`;
  return fetch(url)
    .then(res => {
      if (!res.ok) {
        throw Error(`Failed to get from ${url}`);
      }
      return res.json();
    })
    .then(data => {
      if (!data.hasOwnProperty("values")) {
        throw Error("Invalid data. Field `values` should exist.");
      }
      if (!data.hasOwnProperty("columns")) {
        throw Error("Invalid data. Field `columns` should exist.");
      }
      if (!data.hasOwnProperty("rows")) {
        throw Error("Invalid data. Field `rows` should exist.");
      }
      if (data.columns.length !== data.values.length) {
        throw Error("Invalid data. Column and Values are inconsistent.");
      }

      const values: number[] = [];
      const rowLength: number = data.rows.length;
      for (const x of data.values) {
        if (rowLength !== x.length) {
          throw Error("Invalid data. Row and Values are inconsistent.");
        }
        Array.prototype.push.apply(values, x);
      }
      return {
        maxValue: data.maxvalue,
        values,
        numColumns: data.columns.length,
        numRows: data.rows.length
      };
    });
}

export interface IHeatMap {
  maxValue: number;
  values: number[];
  numColumns: number;
  numRows: number;
}
