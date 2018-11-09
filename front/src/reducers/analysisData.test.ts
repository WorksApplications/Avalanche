// tslint:disable:no-submodule-imports no-implicit-dependencies
import "jest-dom/extend-expect";
import { IHeatMap } from "../clients/heatMapClient";
import { reduceHeatMap } from "./analysisData";

describe("reduceHeatMap", () => {
  it("does nothing if length < maxValueSize", () => {
    const input: IHeatMap = { maxValue: 3, values: [1, 2, 3, 2, 1, 0] };

    expect(reduceHeatMap(input, 10)).toEqual(input);
  });

  it("reduces with largest value", () => {
    const input: IHeatMap = { maxValue: 3, values: [1, 2, 3, 2, 1, 0] };

    expect(reduceHeatMap(input, 3)).toEqual({
      maxValue: 3,
      values: [2, 3, 1]
    });
  });

  it("reduces well with large amount of values", () => {
    const input: IHeatMap = {
      maxValue: 9,
      values: Array.from(new Array(100), (v, i) => i % 9)
    };

    expect(reduceHeatMap(input, 10)).toEqual({
      maxValue: 9,
      values: Array.from(new Array(10), () => 8)
    });
  });
});
