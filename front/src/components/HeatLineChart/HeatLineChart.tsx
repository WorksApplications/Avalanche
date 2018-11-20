import * as React from "react";

import styles from "./HeatLineChart.scss";

interface IProperty {
  meanValues: number[];
  maxValues: number[];
  maxValueOfData: number;
  numColumns: number;
  numRows: number;
  hash: string;

  onSectionSelect(start: number, end: number): void;
}

interface IMarkerTooltipState {
  sparkValue: number;
  positionX: number;
  exists: boolean;
}

interface ISectionSelectionTooltipState {
  normalizedPositionX: number;
  exists: boolean;
}

const initialState = {
  makerTooltip: null as IMarkerTooltipState | null,
  sectionSelectionTooltip: null as ISectionSelectionTooltipState | null,
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
const textSize = 0.1;

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

  public componentDidMount() {
    document.addEventListener("click", this.onClickOutside, true);
  }

  public componentWillUnmount() {
    document.removeEventListener("click", this.onClickOutside, true);
  }

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
          onClick={this.onGraphClick}
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
            <filter id={`text-bg-${hash}`}>
              <feFlood floodColor="white" floodOpacity={0.8} result="goo" />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
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
        {this.renderMarkerTooltip()}
        {this.renderSectionSelectionTooltip()}
      </div>
    );
  }

  private renderSelectingSection() {
    let normalizedSection;
    let sectionInSvg;
    if (this.state.sectionStart !== null && this.state.sectionEnd !== null) {
      normalizedSection =
        this.state.sectionStart < this.state.sectionEnd
          ? { start: this.state.sectionStart, end: this.state.sectionEnd }
          : { start: this.state.sectionEnd, end: this.state.sectionStart };

      const point1 =
        normalizedSection.start * (svgWidth - padding * 2) + padding;
      const point2 = normalizedSection.end * (svgWidth - padding * 2) + padding;
      sectionInSvg = { x: point1, width: point2 - point1 };
    }
    return (
      <g>
        {this.state.sectionSelectionTooltip &&
          this.state.sectionSelectionTooltip.exists &&
          !sectionInSvg && (
            <path
              d={`M ${this.state.sectionSelectionTooltip.normalizedPositionX *
                (svgWidth - padding * 2) +
                padding} 0 V ${svgHeight}`}
              fill="none"
              stroke="#bfbfbf" /* hsl(0, 0, 75) */
              strokeWidth={strokeWidth * 0.8}
            />
          )}
        {normalizedSection && sectionInSvg && (
          <>
            <rect
              height={svgHeight}
              fill="#dc1f5f40" /* hsl(340, 75, 50) + a */
              stroke="#b2194c" /* hsl(340, 75, 50) */
              strokeWidth={strokeWidth * 0.8}
              x={sectionInSvg.x}
              width={sectionInSvg.width}
            />
            <text
              x={sectionInSvg.x + sectionInSvg.width / 2}
              y={svgHeight - padding}
              textAnchor="middle"
              fontSize={textSize}
              fill="#545454" /* hsl(0, 0, 33) */
              filter={`url(#text-bg-${this.props.hash})`}
            >
              T +
              {(
                (normalizedSection.end - normalizedSection.start) *
                this.props.numColumns
              ).toFixed(1)}
              s
            </text>
          </>
        )}
      </g>
    );
  }

  private renderMarkerTooltip() {
    return (
      this.state.makerTooltip && (
        <div
          className={[
            styles.markerTooltip,
            this.state.makerTooltip.exists ? styles.open : styles.close
          ].join(" ")}
          style={{
            left: `${this.state.makerTooltip.positionX}px`
          }}
        >
          <span className={styles.markerTooltipMessage}>
            {`spike: ${(this.state.makerTooltip.sparkValue * 100).toFixed(
              0
            )}% of max`}
          </span>
        </div>
      )
    );
  }

  private renderSectionSelectionTooltip() {
    if (!this.state.sectionSelectionTooltip || !this.svgRef.current) {
      return false;
    }
    const svgRect = this.svgRef.current.getBoundingClientRect();
    const tooltipLeft =
      (this.state.sectionSelectionTooltip.normalizedPositionX *
        svgRect.width *
        (svgWidth - padding * 2)) /
        svgWidth +
      (svgRect.width * padding) / svgWidth; // consider padding in SVG coordinate system
    const targetTime =
      this.state.sectionSelectionTooltip.normalizedPositionX *
      this.props.numColumns;
    const targetValue = this.props.meanValues[
      this.state.sectionSelectionTooltip.normalizedPositionX >= 1.0
        ? this.props.meanValues.length - 1
        : this.state.sectionSelectionTooltip.normalizedPositionX <= 0.0
        ? 0
        : Math.round(
            this.props.meanValues.length *
              this.state.sectionSelectionTooltip.normalizedPositionX
          )
    ];
    return (
      <div
        className={[
          styles.sectionSelectionTooltip,
          this.state.sectionSelectionTooltip.exists ? styles.open : styles.close
        ].join(" ")}
        style={{
          left: `${tooltipLeft}px`
        }}
      >
        <span className={styles.sectionSelectionTooltipMessage}>
          T: {targetTime.toFixed(1)}s
          <br />
          V: {targetValue.toFixed(2)}
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
        makerTooltip: {
          exists: true,
          sparkValue: y,
          positionX: rect.left - wrapRect.left + rect.width / 2 - 60 // align middle
        }
      });
    }
  };

  private onMouseLeaveFromMarker = () => {
    this.setState((s: State) => ({
      makerTooltip: { ...s.makerTooltip!, exists: false }
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
        sectionSelectionTooltip: null
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
        sectionSelectionTooltip: {
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
        sectionSelectionTooltip: {
          exists: true,
          normalizedPositionX: sectionEnd
        }
      });
    } else {
      const svgRect = this.svgRef.current!.getBoundingClientRect();
      const relativeX = e.clientX - svgRect.left;

      const sectionEnd = normalizeClamp(relativeX, svgRect.width);
      this.setState({
        sectionSelectionTooltip: {
          exists: true,
          normalizedPositionX: sectionEnd
        }
      }); // does not put point
    }
  };

  private onGraphClick = (e: React.MouseEvent<SVGElement>) => {
    e.stopPropagation(); // let not close
  };

  private onMouseLeave = () => {
    this.setState((s: State) => ({
      sectionSelectionTooltip: { ...s.sectionSelectionTooltip!, exists: false }
    }));
  };

  private onClickOutside = (e: Event) => {
    if (e.target instanceof Node) {
      if (!this.wrapRef.current!.contains(e.target)) {
        this.setState({
          isSelecting: false,
          sectionStart: null,
          sectionEnd: null
        });
      }
    }
  };
}

export default HeatLineChart;
