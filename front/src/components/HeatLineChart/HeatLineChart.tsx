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

  onRangeSelect(start: number, end: number): void;
}

interface ISpikeTooltipState {
  spikeValue: number;
  positionX: number;
  exists: boolean;
}

interface IRangeSelectionTooltipState {
  normalizedPositionX: number;
  exists: boolean;
}

const initialState = {
  spikeTooltip: null as ISpikeTooltipState | null,
  rangeSelectionTooltip: null as IRangeSelectionTooltipState | null,
  isSelecting: false,
  rangeStart: null as number | null, // null if isSelecting===false
  rangeEnd: null as number | null, // null if isSelecting===false
  lastMouseDown: 0
};

type State = Readonly<typeof initialState>;

export type Property = Pick<
  IProperty,
  Exclude<keyof IProperty, "hash" | "onRangeSelect">
>;

const paddingInSvg = 0.1;
const spikeSizeInSvg = 0.1;
const heightInSvg = 1;
const widthInSvg = 10;
const strokeWidthInSvg = 0.008;

// like V sign (h:w=2:1)
const spikeDrawString = `M ${spikeSizeInSvg / 4} 0 L ${spikeSizeInSvg /
  2} ${spikeSizeInSvg}  ${(spikeSizeInSvg * 3) / 4} 0`;

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
    if (points[i].x - ret[ret.length - 1].x > spikeSizeInSvg / 5) {
      ret.push(points[i]);
    }
  }
  return ret;
}

function normalizeClampInSvg(x: number, width: number) {
  const val =
    ((x / width) * widthInSvg - paddingInSvg) / (widthInSvg - paddingInSvg * 2);
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
              widthInSvg *
              ((widthInSvg - paddingInSvg * 2) / widthInSvg) +
            paddingInSvg;
          const normalizedY = v / maxValueOfData;
          // y in SVG coordinate
          const y =
            (1 - normalizedY) * (heightInSvg - paddingInSvg * 2) + paddingInSvg;
          return `${x},${y}`;
        })
        .join(" ")
  );

  private calcSpikes = memoizeOne(
    (maxValues: number[], maxValueOfData: number) =>
      reduceMaxPointsToShow(
        maxValues
          .map((v, i) => {
            const normalizedX = i / (maxValues.length - 1);
            // x in SVG coordinate
            const x =
              normalizedX *
                widthInSvg *
                ((widthInSvg - paddingInSvg * 2) / widthInSvg) +
              paddingInSvg;
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
          viewBox={`0 0 ${widthInSvg} ${heightInSvg}`}
          ref={this.svgRef}
          onMouseDown={this.onGraphMouseDown}
          onMouseUp={this.onGraphMouseUp}
          onMouseMove={this.onGraphMove}
          onContextMenu={this.onGraphContextMenu}
          onClick={this.onGraphClick}
        >
          <defs>
            {this.renderChartDef()}
            {this.renderSpikeDef()}
          </defs>
          {this.renderChartBody()}
          {this.renderSelectingRange()}
          {this.renderSpikeBodies()}
        </svg>
        {this.renderSpikeTooltip()}
        {this.renderSelectionRangeTooltip()}
        {this.renderRangeLengthTooltip()}
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
          width={widthInSvg}
          height={heightInSvg}
        >
          <polyline
            strokeLinecap="round"
            points={meanPointsString}
            fill="transparent"
            stroke="#e6f2fd"
            strokeWidth={strokeWidthInSvg}
          />
        </mask>
      </>
    );
  }

  private renderSpikeDef() {
    const { hash } = this.props;

    return (
      <g id={`spike-${hash}`}>
        <rect
          fill="transparent"
          width={spikeSizeInSvg}
          height={spikeSizeInSvg}
        />
        <path
          d={spikeDrawString}
          fill="none"
          stroke="#e5195d" /* hsl(340, 80, 50) */
          strokeWidth={strokeWidthInSvg * 0.8}
        />
      </g>
    );
  }

  private renderChartBody() {
    const { hash } = this.props;

    return (
      <g>
        <rect
          width={widthInSvg}
          height={heightInSvg}
          stroke="none"
          fill={`url(#mean-color-${hash})`}
          mask={`url(#mean-line-${hash})`}
        />
      </g>
    );
  }

  private renderSelectingRange() {
    if (!this.state.rangeSelectionTooltip) {
      // empty group
      return <g />;
    }

    if (this.state.rangeStart === null || this.state.rangeEnd === null) {
      // in SVG coordinate
      const beginX =
        this.state.rangeSelectionTooltip.normalizedPositionX *
          (widthInSvg - paddingInSvg * 2) +
        paddingInSvg;

      // vertical line during hover
      return (
        <g>
          {this.state.rangeSelectionTooltip.exists && (
            <path
              d={`M ${beginX} 0 V ${heightInSvg}`}
              fill="none"
              stroke="#bfbfbf" /* hsl(0, 0, 75) */
              strokeWidth={strokeWidthInSvg * 0.8}
            />
          )}
        </g>
      );
    }

    let normalizedRangeStart;
    let normalizedRangeEnd;
    if (this.state.rangeStart < this.state.rangeEnd) {
      normalizedRangeStart = this.state.rangeStart;
      normalizedRangeEnd = this.state.rangeEnd;
    } else {
      normalizedRangeStart = this.state.rangeEnd;
      normalizedRangeEnd = this.state.rangeStart;
    }
    const point1 =
      normalizedRangeStart * (widthInSvg - paddingInSvg * 2) + paddingInSvg;
    const point2 =
      normalizedRangeEnd * (widthInSvg - paddingInSvg * 2) + paddingInSvg;

    // range in SVG coordinate
    const range = { x: point1, width: point2 - point1 };

    // colored rectangle during selecting
    return (
      <g>
        <rect
          height={heightInSvg}
          fill="#dc1f5f40" /* hsl(340, 75, 50) + a */
          stroke="#b2194c" /* hsl(340, 75, 50) */
          strokeWidth={strokeWidthInSvg * 0.8}
          x={range.x}
          width={range.width}
        />
      </g>
    );
  }

  private renderSpikeBodies() {
    const { maxValues, maxValueOfData, hash } = this.props;

    const spikes = this.calcSpikes(maxValues, maxValueOfData);

    return (
      <g>
        {spikes.map(p => (
          <use
            key={p.x}
            href={`#spike-${hash}`}
            x={p.x - spikeSizeInSvg / 2}
            data-xinsvg={p.x}
            data-y={p.y}
            onMouseMove={this.onMouseMoveOverSpike}
            onMouseLeave={this.onMouseLeaveFromSpike}
          />
        ))}
      </g>
    );
  }

  private renderSpikeTooltip() {
    if (!this.state.spikeTooltip) {
      return;
    }

    const message = `spike: ${(
      this.state.spikeTooltip.spikeValue * 100
    ).toFixed(0)}% of max`;

    return (
      <div
        className={[
          styles.spikeTooltip,
          this.state.spikeTooltip.exists ? styles.open : styles.close
        ].join(" ")}
        style={{
          left: `${this.state.spikeTooltip.positionX}px`
        }}
      >
        <span className={styles.tooltipMessage}>{message}</span>
      </div>
    );
  }

  private renderSelectionRangeTooltip() {
    if (!this.state.rangeSelectionTooltip || !this.svgRef.current) {
      return false;
    }

    const svgWidth = this.svgRef.current.clientWidth; // no border for SVG element
    // left in SVG coordinate
    const tooltipLeft =
      (this.state.rangeSelectionTooltip.normalizedPositionX *
        svgWidth *
        (widthInSvg - paddingInSvg * 2)) /
        widthInSvg +
      (svgWidth * paddingInSvg) / widthInSvg;
    const style: React.CSSProperties =
      tooltipLeft < svgWidth - 100
        ? { left: `${tooltipLeft}px`, textAlign: "left" }
        : {
            right: `${svgWidth - tooltipLeft}px`,
            textAlign: "right"
          };

    const targetTime =
      this.state.rangeSelectionTooltip.normalizedPositionX *
      this.props.numColumns;
    const targetIndex =
      this.state.rangeSelectionTooltip.normalizedPositionX >= 1.0
        ? this.props.meanValues.length - 1
        : this.state.rangeSelectionTooltip.normalizedPositionX <= 0.0
        ? 0
        : Math.round(
            this.props.meanValues.length *
              this.state.rangeSelectionTooltip.normalizedPositionX
          );
    const targetValue = this.props.meanValues[targetIndex] || 0;

    return (
      <div
        className={[
          styles.rangeSelectionTooltip,
          this.state.rangeSelectionTooltip.exists ? styles.open : styles.close
        ].join(" ")}
        style={style}
      >
        <span className={styles.tooltipMessage}>
          T: {targetTime.toFixed(1)}s
          <br />
          {targetValue.toFixed(2)}
        </span>
      </div>
    );
  }

  private renderRangeLengthTooltip = () => {
    if (
      this.state.rangeStart === null ||
      this.state.rangeEnd === null ||
      !this.svgRef.current
    ) {
      return;
    }

    let normalizedRangeStart;
    let normalizedRangeEnd;
    if (this.state.rangeStart < this.state.rangeEnd) {
      normalizedRangeStart = this.state.rangeStart;
      normalizedRangeEnd = this.state.rangeEnd;
    } else {
      normalizedRangeStart = this.state.rangeEnd;
      normalizedRangeEnd = this.state.rangeStart;
    }

    const point1 =
      normalizedRangeStart * (widthInSvg - paddingInSvg * 2) + paddingInSvg;
    const point2 =
      normalizedRangeEnd * (widthInSvg - paddingInSvg * 2) + paddingInSvg;

    // range in SVG coordinate
    const rangeInSvg = { x: point1, width: point2 - point1 };

    const svgWidth = this.svgRef.current.clientWidth; // no border for SVG element

    // range in HTML coordinate (local)
    const rangeInHtmlLocal = {
      x: (rangeInSvg.x / widthInSvg) * svgWidth,
      width: (rangeInSvg.width / widthInSvg) * svgWidth
    };
    const elapsedTime =
      (normalizedRangeEnd - normalizedRangeStart) * this.props.numColumns;
    const message = `${elapsedTime.toFixed(1)}s`;

    return (
      <div
        className={styles.rangeLengthTooltip}
        style={{
          left: `${rangeInHtmlLocal.x}px`,
          width: `${rangeInHtmlLocal.width}px`
        }}
      >
        <span className={styles.tooltipMessage}>{message}</span>
      </div>
    );
  };

  private onMouseMoveOverSpike = (e: React.MouseEvent<SVGUseElement>) => {
    const dataXInSvg = e.currentTarget.dataset.xinsvg;
    const dataY = e.currentTarget.dataset.y;
    if (dataXInSvg && dataY) {
      const xInSvg = parseFloat(dataXInSvg);
      const svgWidth = this.svgRef.current!.clientWidth;
      const y = parseFloat(dataY);

      // x in HTML coordinate (local)
      // message container width is 120px, so aligns middle
      const positionX = (xInSvg / widthInSvg) * svgWidth - 60;

      // to avoid unnecessary update
      if (
        !(
          this.state.spikeTooltip &&
          this.state.spikeTooltip.exists &&
          this.state.spikeTooltip.spikeValue === y &&
          this.state.spikeTooltip.positionX === positionX
        )
      ) {
        this.setState({
          spikeTooltip: {
            exists: true,
            spikeValue: y,
            positionX
          }
        });
      }
    }
  };

  private onMouseLeaveFromSpike = () => {
    this.setState((s: State) => ({
      spikeTooltip: { ...s.spikeTooltip!, exists: false }
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
        rangeStart: null,
        rangeEnd: null,
        rangeSelectionTooltip: null
      });
    } else if (!this.state.isSelecting) {
      e.stopPropagation();

      const svgWidth = this.svgRef.current!.clientWidth;
      // start selecting range
      const rangeStart = normalizeClampInSvg(e.nativeEvent.offsetX, svgWidth);
      this.setState({
        isSelecting: true,
        lastMouseDown: Date.now(),
        rangeStart, // put point
        rangeSelectionTooltip: {
          exists: true,
          normalizedPositionX: rangeStart
        }
      });
    }
  };

  private onGraphMouseUp = (e: React.MouseEvent<SVGElement>) => {
    if (
      this.state.rangeStart !== null &&
      this.state.rangeEnd !== null &&
      this.state.rangeStart !== this.state.rangeEnd &&
      this.state.lastMouseDown + 250 < Date.now() // throttling
    ) {
      const svgWidth = this.svgRef.current!.clientWidth;
      const rangeEnd = normalizeClampInSvg(e.nativeEvent.offsetX, svgWidth);

      // finish selecting range
      let startPoint;
      let endPoint;
      if (this.state.rangeStart < rangeEnd) {
        startPoint = this.state.rangeStart;
        endPoint = rangeEnd;
      } else {
        startPoint = rangeEnd;
        endPoint = this.state.rangeStart;
      }

      // fire event with normalized coordinate
      this.props.onRangeSelect(startPoint, endPoint);

      this.setState({
        isSelecting: false,
        rangeStart: null,
        rangeEnd: null
      });
    }
  };

  private onGraphMove = (e: React.MouseEvent<SVGElement>) => {
    if (this.state.isSelecting) {
      e.stopPropagation();

      const svgWidth = this.svgRef.current!.clientWidth;
      const rangeEnd = normalizeClampInSvg(e.nativeEvent.offsetX, svgWidth);

      // to avoid unnecessary update
      if (
        !(
          this.state.rangeSelectionTooltip &&
          this.state.rangeSelectionTooltip.exists &&
          this.state.rangeSelectionTooltip.normalizedPositionX === rangeEnd &&
          this.state.rangeEnd === rangeEnd
        )
      ) {
        this.setState({
          rangeEnd, // put point
          rangeSelectionTooltip: {
            exists: true,
            normalizedPositionX: rangeEnd
          }
        });
      }
    } else {
      const svgWidth = this.svgRef.current!.clientWidth;
      const rangeEnd = normalizeClampInSvg(e.nativeEvent.offsetX, svgWidth);

      // to avoid unnecessary update
      if (
        !(
          this.state.rangeSelectionTooltip &&
          this.state.rangeSelectionTooltip.exists &&
          this.state.rangeSelectionTooltip.normalizedPositionX === rangeEnd
        )
      ) {
        this.setState({
          rangeSelectionTooltip: {
            exists: true,
            normalizedPositionX: rangeEnd
          }
        }); // does not put point
      }
    }
  };

  private onGraphClick = (e: React.MouseEvent<SVGElement>) => {
    e.stopPropagation(); // let not close
  };

  private onMouseLeave = () => {
    this.setState((s: State) => ({
      rangeSelectionTooltip: { ...s.rangeSelectionTooltip!, exists: false }
    }));
  };

  private onClickOutside = (e: Event) => {
    if (e.target instanceof Node) {
      if (!this.wrapRef.current!.contains(e.target)) {
        this.setState({
          isSelecting: false,
          rangeStart: null,
          rangeEnd: null
        });
      }
    }
  };
}

export default HeatLineChart;
