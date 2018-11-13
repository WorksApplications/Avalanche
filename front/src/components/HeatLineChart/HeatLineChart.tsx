import * as React from "react";

export interface IProperty {
  meanValues: number[];
  maxValues: number[];
  maxValueOfData: number;
  hash: string;
}

export type Data = Pick<IProperty, Exclude<keyof IProperty, "hash">>;

// width:height = (about) 10:1
// currently, colored with relative value
class HeatLineChart extends React.Component<IProperty> {
  public render() {
    const { meanValues, maxValues, maxValueOfData, hash } = this.props;
    const padding = 0.05;
    const markSize = 0.1;
    const xNormalizer = meanValues.length - 1;

    const meanPointsString = meanValues
      .map((v, i) => {
        const x = (i / xNormalizer) * 10 * ((10 - padding * 2) / 10) + padding;
        const y = (1 - v / maxValueOfData) * (1 - padding * 2) + padding;
        return `${x},${y}`;
      })
      .join(" ");
    const maxPoints = maxValues
      .map((v, i) => {
        const x = (i / xNormalizer) * 10 * ((10 - padding * 2) / 10) + padding;
        return { x, y: v / maxValueOfData, i };
      })
      .filter(v => v.y > 0.9);

    return (
      <svg viewBox="0 0 10 1">
        <defs>
          <linearGradient id={`mean-color-${hash}`} x1="0" x2="0" y1="1" y2="0">
            <stop offset="5%" stopColor="#deeafd" />
            <stop offset="40%" stopColor="#7facf6" />
            <stop offset="90%" stopColor="#e91e63" />
          </linearGradient>
          <mask id={`mean-line-${hash}`} x="0" y="0" width="10" height="1">
            <polyline
              strokeLinecap="round"
              points={meanPointsString}
              fill="transparent"
              stroke="#c6dafb"
              strokeWidth="0.01"
            />
          </mask>
          <g id={`notch-${hash}`}>
            <path
              d={`M ${markSize / 4} 0 L ${markSize /
                2} ${markSize}  ${(markSize * 3) / 4} 0`}
              fill="none"
              stroke="#e91e63"
              strokeWidth="0.008"
            />
          </g>
        </defs>
        <g>
          {maxPoints.map(p => (
            <use key={p.x} href={`#notch-${hash}`} x={p.x - markSize / 2} />
          ))}
        </g>
        <g>
          <rect
            width="10"
            height="1"
            style={{
              stroke: "none",
              fill: `url(#mean-color-${hash})`,
              mask: `url(#mean-line-${hash})`
            }}
          />
        </g>
      </svg>
    );
  }
}

export default HeatLineChart;
