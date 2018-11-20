import * as React from "react";

import styles from "./HeatLineChart.scss";

interface IProperty {
  meanValues: number[];
  maxValues: number[];
  maxValueOfData: number;
  hash: string;

  onSectionSelect(start: number, end: number): void;
}

interface IMarkerPopoverState {
  sparkValue: number;
  positionX: number;
  exists: boolean;
}

interface ISectionSelectionPopoverState {
  normalizedPositionX: number;
  exists: boolean;
}

const initialState = {
  makerPopover: null as IMarkerPopoverState | null,
  sectionSelectionPopover: null as ISectionSelectionPopoverState | null,
  isSelecting: false,
  sectionStart: null as number | null,
  sectionEnd: null as number | null,
  lastMouseDown: 0
};

type State = Readonly<typeof initialState>;

export type Property = Pick<
  IProperty,
  Exclude<keyof IProperty, "hash" | "onSectionSelect">
>;

const padding = 0.1;
const markSize = 0.1;
const svgHeight = 1;
const svgWidth = 10;
const strokeWidth = 0.008;

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

function normalizeClamp(point: number, entireWidth: number) {
  const val =
    ((point / entireWidth) * svgWidth - padding) / (svgWidth - padding * 2);
  return val < 0 ? 0 : 1 < val ? 1 : val;
}

// width:height = (about) 10:1
// currently, colored with relative value
class HeatLineChart extends React.Component<IProperty, State> {
  public readonly state: State = initialState;
  private wrapRef = React.createRef<HTMLDivElement>();
  private svgRef = React.createRef<SVGSVGElement>();

  public render() {
    const { meanValues, maxValues, maxValueOfData, hash } = this.props;
    const xNormalizer = meanValues.length - 1;

    const meanPointsString = meanValues
      .map((v, i) => {
        const x =
          (i / xNormalizer) * svgWidth * ((svgWidth - padding * 2) / svgWidth) +
          padding;
        const y =
          (1 - v / maxValueOfData) * (svgHeight - padding * 2) + padding;
        return `${x},${y}`;
      })
      .join(" ");
    const maxPoints = maxValues
      .map((v, i) => {
        const x =
          (i / xNormalizer) * svgWidth * ((svgWidth - padding * 2) / svgWidth) +
          padding;
        return { x, y: v / maxValueOfData, i };
      })
      .filter(v => v.y > 0.9);
    const reducedMaxPoints = reduceMaxPoints(maxPoints);

    return (
      <div
        className={styles.wrap}
        ref={this.wrapRef}
        onMouseLeave={this.onMouseLeave}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          ref={this.svgRef}
          onMouseDown={this.onGraphMouseDown}
          onMouseUp={this.onGraphMouseUp}
          onMouseMove={this.onGraphMove}
          onContextMenu={this.onGraphContextMenu}
        >
          <defs>
            <linearGradient
              id={`mean-color-${hash}`}
              x1="0"
              x2="0"
              y1="1"
              y2="0"
            >
              <stop offset="5%" stopColor="#e6f2fd" /* hsl(210, 90, 95) */ />
              <stop offset="40%" stopColor="#89b6f5" /* hsl(215, 85, 75) */ />
              <stop offset="90%" stopColor="#e5195d" /* hsl(340, 80, 50) */ />
            </linearGradient>
            <mask
              id={`mean-line-${hash}`}
              x="0"
              y="0"
              width={svgWidth}
              height={svgHeight}
            >
              <polyline
                strokeLinecap="round"
                points={meanPointsString}
                fill="transparent"
                stroke="#e6f2fd"
                strokeWidth={strokeWidth}
              />
            </mask>
            <g id={`notch-${hash}`}>
              <rect fill="transparent" width={markSize} height={markSize} />
              <path
                d={`M ${markSize / 4} 0 L ${markSize /
                  2} ${markSize}  ${(markSize * 3) / 4} 0`}
                fill="none"
                stroke="#e5195d" /* hsl(340, 80, 50) */
                strokeWidth={strokeWidth * 0.8}
              />
            </g>
          </defs>
          <g>
            <rect
              width={svgWidth}
              height={svgHeight}
              stroke="none"
              fill={`url(#mean-color-${hash})`}
              mask={`url(#mean-line-${hash})`}
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
          {this.renderSelectingSection()}
        </svg>
        {this.renderMarkerPopOver()}
        {this.renderSectionSelectionPopover()}
      </div>
    );
  }

  private renderSelectingSection() {
    let section;
    if (this.state.sectionStart !== null && this.state.sectionEnd !== null) {
      const point1 =
        this.state.sectionStart * (svgWidth - padding * 2) + padding;
      const point2 = this.state.sectionEnd * (svgWidth - padding * 2) + padding;
      section =
        point1 < point2
          ? {
              // selecting rightward
              x: point1,
              width: point2 - point1
            }
          : // selecting leftward
            {
              x: point2,
              width: point1 - point2
            };
    }
    return (
      <g>
        {this.state.sectionSelectionPopover &&
          this.state.sectionSelectionPopover.exists &&
          !section && (
            <path
              d={`M ${this.state.sectionSelectionPopover.normalizedPositionX *
                (svgWidth - padding * 2) +
                padding} 0 V 1`}
              fill="none"
              stroke="#bfbfbf" /* hsl(0, 0, 75) */
              strokeWidth={strokeWidth * 0.8}
            />
          )}
        {section && (
          <rect
            height={svgHeight}
            fill="#dc1f5f40" /* hsl(340, 75, 50) + a */
            stroke="#b2194c" /* hsl(340, 75, 50) */
            strokeWidth={strokeWidth * 0.8}
            x={section.x}
            width={section.width}
          />
        )}
      </g>
    );
  }

  private renderMarkerPopOver() {
    return (
      this.state.makerPopover && (
        <div
          className={[
            styles.markerPopover,
            this.state.makerPopover.exists ? styles.open : styles.close
          ].join(" ")}
          style={{
            left: `${this.state.makerPopover.positionX}px`
          }}
        >
          <span className={styles.markerPopoverMessage}>
            {`spike: ${(this.state.makerPopover.sparkValue * 100).toFixed(
              0
            )}% of max`}
          </span>
        </div>
      )
    );
  }

  private renderSectionSelectionPopover() {
    if (!this.state.sectionSelectionPopover || !this.svgRef.current) {
      return false;
    }
    const svgRect = this.svgRef.current.getBoundingClientRect();
    const popoverLeft =
      (this.state.sectionSelectionPopover.normalizedPositionX *
        svgRect.width *
        (svgWidth - padding * 2)) /
        svgWidth +
      (svgRect.width * padding) / svgWidth; // consider padding in SVG coordinate system
    const targetValue = this.props.meanValues[
      this.state.sectionSelectionPopover.normalizedPositionX >= 1.0
        ? this.props.meanValues.length - 1
        : this.state.sectionSelectionPopover.normalizedPositionX <= 0.0
        ? 0
        : Math.round(
            this.props.meanValues.length *
              this.state.sectionSelectionPopover.normalizedPositionX
          )
    ];
    return (
      <div
        className={[
          styles.sectionSelectionPopover,
          this.state.sectionSelectionPopover.exists ? styles.open : styles.close
        ].join(" ")}
        style={{
          left: `${popoverLeft}px`
        }}
      >
        <span className={styles.sectionSelectionPopoverMessage}>
          {targetValue.toFixed(2)}
        </span>
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
        makerPopover: {
          exists: true,
          sparkValue: y,
          positionX: rect.left - wrapRect.left + rect.width / 2 - 60 // align middle
        }
      });
    }
  };

  private onMouseLeaveFromMarker = () => {
    this.setState((s: State) => ({
      makerPopover: { ...s.makerPopover!, exists: false }
    }));
  };

  private onGraphContextMenu = (e: React.MouseEvent<SVGElement>) => {
    e.preventDefault();
  };

  private onGraphMouseDown = (e: React.MouseEvent<SVGElement>) => {
    if (e.nativeEvent.button === 2) {
      // right click
      // reset selection
      e.preventDefault();
      this.setState({
        isSelecting: false,
        sectionStart: null,
        sectionEnd: null,
        sectionSelectionPopover: null
      });
    } else if (!this.state.isSelecting) {
      e.stopPropagation();
      const svgRect = this.svgRef.current!.getBoundingClientRect();
      const relativeX = e.clientX - svgRect.left;

      // start selecting section
      const sectionStart = normalizeClamp(relativeX, svgRect.width);
      this.setState({
        isSelecting: true,
        lastMouseDown: Date.now(),
        sectionStart, // put point
        sectionSelectionPopover: {
          exists: true,
          normalizedPositionX: sectionStart
        }
      });
    }
  };

  private onGraphMouseUp = (e: React.MouseEvent<SVGElement>) => {
    if (
      this.state.sectionStart !== null &&
      this.state.sectionEnd !== null &&
      this.state.sectionStart !== this.state.sectionEnd &&
      this.state.lastMouseDown + 250 < Date.now() // throttling
    ) {
      const svgRect = this.svgRef.current!.getBoundingClientRect();
      const sectionEnd = normalizeClamp(
        e.clientX - svgRect.left,
        svgRect.width
      );

      // finish selecting section
      let startPoint;
      let endPoint;
      if (this.state.sectionStart < sectionEnd) {
        startPoint = this.state.sectionStart;
        endPoint = sectionEnd;
      } else {
        startPoint = sectionEnd;
        endPoint = this.state.sectionStart;
      }

      this.props.onSectionSelect(startPoint, endPoint);

      this.setState({
        isSelecting: false,
        sectionStart: null,
        sectionEnd: null
      });
    }
  };

  private onGraphMove = (e: React.MouseEvent<SVGElement>) => {
    if (this.state.isSelecting) {
      e.stopPropagation();
      const svgRect = this.svgRef.current!.getBoundingClientRect();
      const relativeX = e.clientX - svgRect.left;

      const sectionEnd = normalizeClamp(relativeX, svgRect.width);
      this.setState({
        sectionEnd, // put point
        sectionSelectionPopover: {
          exists: true,
          normalizedPositionX: sectionEnd
        }
      });
    } else {
      const svgRect = this.svgRef.current!.getBoundingClientRect();
      const relativeX = e.clientX - svgRect.left;

      const sectionEnd = normalizeClamp(relativeX, svgRect.width);
      this.setState({
        sectionSelectionPopover: {
          exists: true,
          normalizedPositionX: sectionEnd
        }
      }); // does not put point
    }
  };

  private onMouseLeave = () => {
    this.setState((s: State) => ({
      sectionSelectionPopover: { ...s.sectionSelectionPopover!, exists: false }
    }));
  };
}

export default HeatLineChart;
