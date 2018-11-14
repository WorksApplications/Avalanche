import * as React from "react";

import styles from "./HeatLineChart.scss";

export interface IProperty {
  meanValues: number[];
  maxValues: number[];
  maxValueOfData: number;
  hash: string;
}

interface IPopoverState {
  sparkValue: number;
  positionX: number;
  exists: boolean;
}

const initialState = {
  popover: null as IPopoverState | null
};

type State = Readonly<typeof initialState>;

export type Data = Pick<IProperty, Exclude<keyof IProperty, "hash">>;

const padding = 0.05;
const markSize = 0.1;

function reduceMaxPoints(
  points: Array<{ x: number; y: number; i: number }>
): Array<{ x: number; y: number; i: number }> {
  if (points.length === 0) {
    return [];
  }

  const ret = [points[0]];
  for (let i = 1; i < points.length; i++) {
    if (points[i].x - ret[ret.length - 1].x > markSize / 5) {
      ret.push(points[i]);
    }
  }
  return ret;
}

// width:height = (about) 10:1
// currently, colored with relative value
class HeatLineChart extends React.Component<IProperty, State> {
  public readonly state: State = initialState;
  private wrapRef = React.createRef<HTMLDivElement>();

  public render() {
    const { meanValues, maxValues, maxValueOfData, hash } = this.props;
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
    const reducedMaxPoints = reduceMaxPoints(maxPoints);

    return (
      <div className={styles.wrap} ref={this.wrapRef}>
        <svg viewBox="0 0 10 1">
          <defs>
            <linearGradient
              id={`mean-color-${hash}`}
              x1="0"
              x2="0"
              y1="1"
              y2="0"
            >
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
              <rect fill="transparent" width={markSize} height={markSize} />
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
          <g>
            {reducedMaxPoints.map(p => (
              <use
                key={p.x}
                href={`#notch-${hash}`}
                x={p.x - markSize / 2}
                data-y={p.y}
                onMouseMove={this.onMouseMoveOverMarker}
                onMouseLeave={this.onMouseLeaveFromMarker}
              />
            ))}
          </g>
        </svg>
        {this.state.popover && (
          <div
            className={[
              styles.popover,
              this.state.popover.exists ? styles.open : styles.close
            ].join(" ")}
            style={{
              left: `${this.state.popover.positionX}px`
            }}
          >
            <span className={styles.popoverMessage}>
              {`spike: ${(this.state.popover.sparkValue * 100).toFixed(
                0
              )}% of max`}
            </span>
          </div>
        )}
      </div>
    );
  }

  private onMouseMoveOverMarker = (e: React.MouseEvent<SVGUseElement>) => {
    const dataY = e.currentTarget.dataset.y;
    if (dataY) {
      const rect = e.currentTarget.getBoundingClientRect();
      const wrapRect = this.wrapRef.current!.getBoundingClientRect();
      const y = parseFloat(dataY);
      this.setState({
        popover: {
          exists: true,
          sparkValue: y,
          positionX: rect.left - wrapRect.left + rect.width / 2 - 60 // align middle
        }
      });
    }
  };

  private onMouseLeaveFromMarker = () => {
    this.setState((s: State) => ({
      popover: { ...s.popover!, exists: false }
    }));
  };
}

export default HeatLineChart;
