import { FLAMESCOPE_API_BASE } from "../constants";

export default function(fileName: string): Promise<IHeatMap> {
  const url = `${FLAMESCOPE_API_BASE}/?filename=${fileName}`;
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
        values
      };
    });
}

export interface IHeatMap {
  maxValue: number;
  values: number[];
}
