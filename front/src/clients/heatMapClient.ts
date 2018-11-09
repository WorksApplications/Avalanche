import { FLAMESCOPE_API_BASE } from "../constants";

export default function(fileName: string): Promise<IHeatMap> {
  const url = `${FLAMESCOPE_API_BASE}/?filename=${fileName}`;
  return new Promise<IHeatMap>(async (resolve, reject) => {
    const res = await fetch(url);
    if (!res.ok) {
      reject(Error(`Failed to get from ${url}`));
      return;
    }

    const data = await res.json();
    if (!data.hasOwnProperty("values")) {
      reject(Error("Invalid data. Field `values` should exist."));
      return;
    }
    if (!data.hasOwnProperty("columns")) {
      reject(Error("Invalid data. Field `columns` should exist."));
      return;
    }
    if (!data.hasOwnProperty("rows")) {
      reject(Error("Invalid data. Field `rows` should exist."));
    }
    if (data.columns.length !== data.values.length) {
      reject(Error("Invalid data. Column and Values are inconsistent."));
    }

    const values: number[] = [];
    const rowLength: number = data.rows.length;
    for (const x of data.values) {
      if (rowLength !== x.length) {
        reject(Error("Invalid data. Row and Values are inconsistent."));
      }
      Array.prototype.push.apply(values, x);
    }
    resolve({
      maxValue: data.maxvalue,
      values
    });
  });
}

export interface IHeatMap {
  maxValue: number;
  values: number[];
}
