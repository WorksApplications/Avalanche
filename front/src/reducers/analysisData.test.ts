// tslint:disable:no-submodule-imports no-implicit-dependencies
import "jest-dom/extend-expect";
import { IHeatMap } from "../clients/heatMapClient";
import { convertCode, convertHeatMap } from "./analysisData";

describe("convertHeatMap", () => {
  it("does not reduce data if length < maxValueSize", () => {
    const input: IHeatMap = {
      maxValue: 3,
      values: [1, 2, 3, 2, 1, 0],
      numColumns: 1,
      numRows: 1
    };

    expect(convertHeatMap(input, 10)).toEqual({
      maxValues: input.values,
      meanValues: input.values,
      maxValueOfData: 3,
      numColumns: 1,
      numRows: 1
    });
  });

  it("reduces with largest values and mean values in a window", () => {
    const input: IHeatMap = {
      maxValue: 3,
      values: [1, 2, 3, 2, 1, 0],
      numColumns: 1,
      numRows: 1
    };

    expect(convertHeatMap(input, 3)).toEqual({
      maxValues: [2, 3, 1],
      meanValues: [1.5, 2.5, 0.5],
      maxValueOfData: 3,
      numColumns: 1,
      numRows: 1
    });
  });

  it("reduces well with large amount of values", () => {
    const input: IHeatMap = {
      maxValue: 8,
      values: Array.from(new Array(100), (v, i) => i % 10),
      numColumns: 20,
      numRows: 5
    };

    expect(convertHeatMap(input, 10)).toEqual({
      maxValues: Array.from(new Array(10), () => 9),
      meanValues: Array.from(new Array(10), () => 4.5),
      maxValueOfData: 8,
      numColumns: 20,
      numRows: 5
    });
  });
});

describe("convertCode", () => {
  it("produces [] if input is []", () => {
    const input: any[] = [];

    expect(convertCode(input)).toEqual([]);
  });

  it("produces [[$]] when input is [#] (#:no linebreaks)", () => {
    const input = [{ snippet: "foo" }];

    expect(convertCode(input)).toEqual([[{ fragment: "foo" }]]);
  });

  it("produces [[$],[$]] when input is [#] (#: 1 linebreak)", () => {
    const input = [{ snippet: "foo\nbar" }];

    expect(convertCode(input)).toEqual([
      [{ fragment: "foo" }],
      [{ fragment: "bar" }]
    ]);
  });

  it("produces [[$],[$],[$]] when input is [#] (#: 2 linebreaks)", () => {
    const input = [{ snippet: "foo\nbar\nbaz" }];

    expect(convertCode(input)).toEqual([
      [{ fragment: "foo" }],
      [{ fragment: "bar" }],
      [{ fragment: "baz" }]
    ]);
  });

  it("produces [[$,$]] when input is [#,#] (#: no linebreaks)", () => {
    const input = [{ snippet: "foo" }, { snippet: "bar" }];

    expect(convertCode(input)).toEqual([
      [{ fragment: "foo" }, { fragment: "bar" }]
    ]);
  });

  it("produces [[$,$,$]] when input is [#,#,#] (#: no linebreaks)", () => {
    const input = [{ snippet: "foo" }, { snippet: "bar" }, { snippet: "baz" }];

    expect(convertCode(input)).toEqual([
      [{ fragment: "foo" }, { fragment: "bar" }, { fragment: "baz" }]
    ]);
  });

  it("produces [[$,$],[$,$]] when input is [#1,#2,#1] (#1: no linebreaks, #2: 1 linebreak)", () => {
    const input = [
      { snippet: "foo" },
      { snippet: "bar\nbaz" },
      { snippet: "qux" }
    ];

    expect(convertCode(input)).toEqual([
      [{ fragment: "foo" }, { fragment: "bar" }],
      [{ fragment: "baz" }, { fragment: "qux" }]
    ]);
  });

  it("produces [[$,$],[$],[$,$]] when input is [#1,#2,#1] (#1: no linebreaks, #2: 2 linebreaks)", () => {
    const input = [
      { snippet: "foo" },
      { snippet: "bar\nbaz\nqux" },
      { snippet: "quux" }
    ];

    expect(convertCode(input)).toEqual([
      [{ fragment: "foo" }, { fragment: "bar" }],
      [{ fragment: "baz" }],
      [{ fragment: "qux" }, { fragment: "quux" }]
    ]);
  });

  it("produces [[$,$],[$,$],[$,$]] when input is [#1,#2,#2,#1] (#1: no linebreaks, #2: 1 linebreak)", () => {
    const input = [
      { snippet: "foo" },
      { snippet: "bar\nbaz" },
      { snippet: "qux\nquux" },
      { snippet: "corge" }
    ];

    expect(convertCode(input)).toEqual([
      [{ fragment: "foo" }, { fragment: "bar" }],
      [{ fragment: "baz" }, { fragment: "qux" }],
      [{ fragment: "quux" }, { fragment: "corge" }]
    ]);
  });
});
