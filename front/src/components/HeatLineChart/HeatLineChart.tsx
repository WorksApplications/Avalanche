import memoizeOne from "memoize-one";
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
  sectionStart: null as number | null, // null if isSelecting===false
  sectionEnd: null as number | null, // null if isSelecting===false
  lastMouseDown: 0
};

type State = Readonly<typeof initialState>;

export type Property = Pick<
  IProperty,
  Exclude<keyof IProperty, "hash" | "onSectionSelect">
>;

const graphSvgPadding = 0.1;
const markSize = 0.1;
const svgHeight = 1;
const svgWidth = 10;
const strokeWidth = 0.008;

// like V sign (h:w=2:1)
const sparkDrawString = `M ${markSize / 4} 0 L ${markSize /
  2} ${markSize}  ${(markSize * 3) / 4} 0`;

/**
 * Reduce points
 * @param points x: in SVG, y: relative value from max, i: seq no of original max values (including not spike)
 */
function reduceMaxPointsToShow(
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

function normalizeClampInSvg(x: number, width: number) {
  const val =
    ((x / width) * svgWidth - graphSvgPadding) /
    (svgWidth - graphSvgPadding * 2);
  return val < 0 ? 0 : 1 < val ? 1 : val;
}

// currently, colored with relative value
class HeatLineChart extends React.Component<IProperty, State> {
  public readonly state: State = initialState;
  private wrapRef = React.createRef<HTMLDivElement>();
  private svgRef = React.createRef<SVGSVGElement>();

  private calcMeanPointsString = memoizeOne(
    (meanValues: number[], maxValueOfData: number) =>
      meanValues
        .map((v, i) => {
          const normalizedX = i / (meanValues.length - 1);
          // x in SVG coordinate
          const x =
            normalizedX *
              svgWidth *
              ((svgWidth - graphSvgPadding * 2) / svgWidth) +
            graphSvgPadding;
          const normalizedY = v / maxValueOfData;
          // y in SVG coordinate
          const y =
            (1 - normalizedY) * (svgHeight - graphSvgPadding * 2) +
            graphSvgPadding;
          return `${x},${y}`;
        })
        .join(" ")
  );

  private calcSparks = memoizeOne(
    (maxValues: number[], maxValueOfData: number) =>
      reduceMaxPointsToShow(
        maxValues
          .map((v, i) => {
            const normalizedX = i / (maxValues.length - 1);
            // x in SVG coordinate
            const x =
              normalizedX *
                svgWidth *
                ((svgWidth - graphSvgPadding * 2) / svgWidth) +
              graphSvgPadding;
            return { x, y: v / maxValueOfData, i };
          })
          .filter(v => v.y > 0.9)
      )
  );

  public componentDidMount() {
    document.addEventListener("click", this.onClickOutside, true);
  }

  public componentWillUnmount() {
    document.removeEventListener("click", this.onClickOutside, true);
  }

  public render() {
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
            {this.renderChartDef()}
            {this.renderSparkDef()}
          </defs>
          {this.renderChartBody()}
          {this.renderSelectingSection()}
          {this.renderSparkBodies()}
        </svg>
        {this.renderMarkerTooltip()}
        {this.renderSectionSelectionTooltip()}
        {this.renderSectionPeriodTooltip()}
      </div>
    );
  }

  private renderChartDef() {
    const { meanValues, maxValueOfData, hash } = this.props;

    const meanPointsString = this.calcMeanPointsString(
      meanValues,
      maxValueOfData
    );

    return (
      <>
        <linearGradient id={`mean-color-${hash}`} x1="0" x2="0" y1="1" y2="0">
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
      </>
    );
  }

  private renderSparkDef() {
    const { hash } = this.props;

    return (
      <g id={`spark-${hash}`}>
        <rect fill="transparent" width={markSize} height={markSize} />
        <path
          d={sparkDrawString}
          fill="none"
          stroke="#e5195d" /* hsl(340, 80, 50) */
          strokeWidth={strokeWidth * 0.8}
        />
      </g>
    );
  }

  private renderChartBody() {
    const { hash } = this.props;

    return (
      <g>
        <rect
          width={svgWidth}
          height={svgHeight}
          stroke="none"
          fill={`url(#mean-color-${hash})`}
          mask={`url(#mean-line-${hash})`}
        />
      </g>
    );
  }

  private renderSelectingSection() {
    if (!this.state.sectionSelectionTooltip) {
      // empty group
      return <g />;
    }

    if (this.state.sectionStart === null || this.state.sectionEnd === null) {
      // in SVG coordinate
      const beginX =
        this.state.sectionSelectionTooltip.normalizedPositionX *
          (svgWidth - graphSvgPadding * 2) +
        graphSvgPadding;

      // vertical line during hover
      return (
        <g>
          {this.state.sectionSelectionTooltip.exists && (
            <path
              d={`M ${beginX} 0 V ${svgHeight}`}
              fill="none"
              stroke="#bfbfbf" /* hsl(0, 0, 75) */
              strokeWidth={strokeWidth * 0.8}
            />
          )}
        </g>
      );
    }

    let normalizedSectionStart;
    let normalizedSectionEnd;
    if (this.state.sectionStart < this.state.sectionEnd) {
      normalizedSectionStart = this.state.sectionStart;
      normalizedSectionEnd = this.state.sectionEnd;
    } else {
      normalizedSectionStart = this.state.sectionEnd;
      normalizedSectionEnd = this.state.sectionStart;
    }
    const point1 =
      normalizedSectionStart * (svgWidth - graphSvgPadding * 2) +
      graphSvgPadding;
    const point2 =
      normalizedSectionEnd * (svgWidth - graphSvgPadding * 2) + graphSvgPadding;

    // section in SVG coordinate
    const section = { x: point1, width: point2 - point1 };

    // colored rectangle during selecting
    return (
      <g>
        <rect
          height={svgHeight}
          fill="#dc1f5f40" /* hsl(340, 75, 50) + a */
          stroke="#b2194c" /* hsl(340, 75, 50) */
          strokeWidth={strokeWidth * 0.8}
          x={section.x}
          width={section.width}
        />
      </g>
    );
  }

  private renderSparkBodies() {
    const { maxValues, maxValueOfData, hash } = this.props;

    const sparks = this.calcSparks(maxValues, maxValueOfData);

    return (
      <g>
        {sparks.map(p => (
          <use
            key={p.x}
            href={`#spark-${hash}`}
            x={p.x - markSize / 2}
            data-y={p.y}
            onMouseMove={this.onMouseMoveOverMarker}
            onMouseLeave={this.onMouseLeaveFromMarker}
          />
        ))}
      </g>
    );
  }

  private renderMarkerTooltip() {
    if (!this.state.makerTooltip) {
      return;
    }

    const message = `spike: ${(
      this.state.makerTooltip.sparkValue * 100
    ).toFixed(0)}% of max`;

    return (
      <div
        className={[
          styles.markerTooltip,
          this.state.makerTooltip.exists ? styles.open : styles.close
        ].join(" ")}
        style={{
          left: `${this.state.makerTooltip.positionX}px`
        }}
      >
        <span className={styles.markerTooltipMessage}>{message}</span>
      </div>
    );
  }

  private renderSectionSelectionTooltip() {
    if (!this.state.sectionSelectionTooltip || !this.svgRef.current) {
      return false;
    }

    const svgRect = this.svgRef.current.getBoundingClientRect();
    // left in SVG coordinate
    const tooltipLeft =
      (this.state.sectionSelectionTooltip.normalizedPositionX *
        svgRect.width *
        (svgWidth - graphSvgPadding * 2)) /
        svgWidth +
      (svgRect.width * graphSvgPadding) / svgWidth;

    const targetTime =
      this.state.sectionSelectionTooltip.normalizedPositionX *
      this.props.numColumns;
    const targetIndex =
      this.state.sectionSelectionTooltip.normalizedPositionX >= 1.0
        ? this.props.meanValues.length - 1
        : this.state.sectionSelectionTooltip.normalizedPositionX <= 0.0
        ? 0
        : Math.round(
            this.props.meanValues.length *
              this.state.sectionSelectionTooltip.normalizedPositionX
          );
    const targetValue = this.props.meanValues[targetIndex] || 0;

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

  private renderSectionPeriodTooltip = () => {
    if (
      this.state.sectionStart === null ||
      this.state.sectionEnd === null ||
      !this.svgRef.current
    ) {
      return;
    }

    let normalizedSectionStart;
    let normalizedSectionEnd;
    if (this.state.sectionStart < this.state.sectionEnd) {
      normalizedSectionStart = this.state.sectionStart;
      normalizedSectionEnd = this.state.sectionEnd;
    } else {
      normalizedSectionStart = this.state.sectionEnd;
      normalizedSectionEnd = this.state.sectionStart;
    }

    const point1 =
      normalizedSectionStart * (svgWidth - graphSvgPadding * 2) +
      graphSvgPadding;
    const point2 =
      normalizedSectionEnd * (svgWidth - graphSvgPadding * 2) + graphSvgPadding;

    // section in SVG coordinate
    const sectionInSvg = { x: point1, width: point2 - point1 };

    const svgRect = this.svgRef.current.getBoundingClientRect();

    // section in HTML coordinate (local)
    const sectionInHtmlLocal = {
      x: (sectionInSvg.x / svgWidth) * svgRect.width,
      width: (sectionInSvg.width / svgWidth) * svgRect.width
    };
    const elapsedTime =
      (normalizedSectionEnd - normalizedSectionStart) * this.props.numColumns;
    const message = `T +${elapsedTime.toFixed(1)}s`;

    return (
      <div
        className={styles.sectionPeriodTooltip}
        style={{
          left: `${sectionInHtmlLocal.x}px`,
          width: `${sectionInHtmlLocal.width}px`
        }}
      >
        <span className={styles.sectionPeriodTooltipMessage}>{message}</span>
      </div>
    );
  };

  private onMouseMoveOverMarker = (e: React.MouseEvent<SVGUseElement>) => {
    const dataY = e.currentTarget.dataset.y;
    if (dataY) {
      const rect = e.currentTarget.getBoundingClientRect();
      const wrapRect = this.wrapRef.current!.getBoundingClientRect();
      const y = parseFloat(dataY);

      // x in HTML coordinate (local)
      const positionX = rect.left - wrapRect.left + rect.width / 2 - 60; // align middle
      this.setState({
        makerTooltip: {
          exists: true,
          sparkValue: y,
          positionX
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
      // x in HTML coordinate (local)
      const relativeX = e.clientX - svgRect.left;

      // start selecting section
      const sectionStart = normalizeClampInSvg(relativeX, svgRect.width);
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
      const sectionEnd = normalizeClampInSvg(
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

      // fire event with normalized coordinate
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

      const sectionEnd = normalizeClampInSvg(relativeX, svgRect.width);
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

      const sectionEnd = normalizeClampInSvg(relativeX, svgRect.width);
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
