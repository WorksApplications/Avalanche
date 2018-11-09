import * as React from "react";

export interface IProperty {
  maxValue: number;
  values: number[];
  hash: string;
}

export type Data = Pick<IProperty, Exclude<keyof IProperty, "hash">>;

// width:height = (about) 10:1
// currently, colored with relative value
const HeatMap: React.StatelessComponent<IProperty> = ({
  values,
  maxValue,
  hash
}) => {
  const padding = 0.05;
  const xNormalizer = values.length - 1;
  const pointsString = values
    .map((v, i) => {
      const x = (i / xNormalizer) * 10 * ((10 - padding * 2) / 10) + padding;
      const y = (1 - v / maxValue) * (1 - padding * 2) + padding;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 10 1">
      <defs>
        <linearGradient id={`color-${hash}`} x1="0" x2="0" y1="1" y2="0">
          <stop offset="30%" stopColor="#c6dafb" />
          <stop offset="60%" stopColor="#f9c4d6" />
          <stop offset="90%" stopColor="#e91e63" />
        </linearGradient>
        <mask id={`line-${hash}`} x="0" y="0" width="10" height="1">
          <polyline
            strokeLinecap="round"
            points={pointsString}
            fill="transparent"
            stroke="#c6dafb"
            strokeWidth="0.02"
          />
        </mask>
      </defs>
      <g>
        <rect
          width="10"
          height="1"
          style={{
            stroke: "none",
            fill: `url(#color-${hash})`,
            mask: `url(#line-${hash})`
          }}
        />
      </g>
    </svg>
  );
};
export default HeatMap;
