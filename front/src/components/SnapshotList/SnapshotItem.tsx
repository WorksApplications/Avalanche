/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from "react";
import { FLAMESCOPE_API_BASE } from "../../constants";
import { normalizedToFlamescopePosition } from "../../helpers";
import { DataState, IPerfCallTreeData } from "../../modules/analysisData";
import { HeatLineChartProperty } from "../HeatLineChart";
import Link from "../Link";
import Spinner from "../Spinner";
import styles from "./SnapshotList.scss";

type HeatMapData = HeatLineChartProperty & {
  numColumns: number;
  numRows: number;
};

export interface IItemProperty {
  uuid: string;
  environment: string;
  podName: string;
  createdAt?: Date;
  link: string;
  heatMap?: HeatMapData;
  heatMapId: string;
  heatMapStatus: DataState;
  perfCallTree?: IPerfCallTreeData;
  perfCallTreeStatus: DataState;
  openByDefault?: boolean;

  getHeatMap(snapshotId: string, heatMapId: string): void;
  onRangeSelect(
    snapshotId: string,
    heatMapId: string,
    start: number,
    end: number
  ): void;
}

const HeatLineChart = React.lazy(() =>
  import(/* webpackChunkName: "heat-line-chart" */ "../HeatLineChart")
);

const PerfCallTree = React.lazy(() =>
  import(/* webpackChunkName: "perf-call-tree" */ "../PerfCallTree")
);

const CodeReport = React.lazy(() =>
  import(/* webpackChunkName: "code-report" */ "../CodeReport")
);

const initialItemState = {
  isGraphOpen: null as boolean | null,
  isTreeOpen: false,
  previousRange: null as { start: number; end: number } | null,
  isCodeOpen: false,
  targetId: null as number | null
};

type ItemState = Readonly<typeof initialItemState>;

// This child component is tightly coupled as a table row element
class SnapshotItem extends React.Component<IItemProperty, ItemState> {
  public static getDerivedStateFromProps(
    props: IItemProperty,
    state: ItemState
  ): ItemState {
    // open the page by default if `openByDefault` is set
    const isGraphOpen =
      state.isGraphOpen !== null
        ? state.isGraphOpen
        : typeof props.openByDefault !== "undefined"
        ? props.openByDefault
        : state.isGraphOpen;
    return { ...state, isGraphOpen };
  }

  public readonly state: ItemState = initialItemState;

  public componentDidMount() {
    if (this.state.isGraphOpen && this.props.heatMapStatus === "empty") {
      this.props.getHeatMap(this.props.uuid, this.props.heatMapId);
    }
  }

  public render() {
    return (
      <tbody data-testid="snapshot">
        <tr onClick={this.onInfoRowClick}>
          <td>{this.props.uuid}</td>
          <td>{this.props.podName}</td>
          <td>{this.props.environment}</td>
          <td data-testid="snapshot-date">
            {(this.props.createdAt && this.props.createdAt.toLocaleString()) ||
              "Unknown"}
          </td>
          <td>
            <Link href={this.props.link}>Framescope</Link>
          </td>
          <td className={styles.expander}>
            <i className={"material-icons"}>
              {this.state.isGraphOpen ? "expand_less" : "expand_more"}
            </i>
          </td>
        </tr>
        {this.state.isGraphOpen && (
          <tr>
            <td colSpan={6} className={styles.graphArea}>
              {this.renderGraphBody()}
            </td>
          </tr>
        )}
        {this.state.isGraphOpen && this.state.isTreeOpen && (
          <tr>
            <td colSpan={6} className={styles.treeArea}>
              {this.state.previousRange && (
                <a
                  className={styles.linkForSelectedRange}
                  href={this.getFlamescopeLink()}
                  target="_blank"
                  rel="noopener"
                >
                  View range in Flamescope
                </a>
              )}
              {this.renderTreeBody()}
            </td>
          </tr>
        )}
        {this.state.isGraphOpen &&
          this.state.isTreeOpen &&
          this.state.isCodeOpen && (
            <tr>
              <td colSpan={6}>{this.renderCodeReportBody()}</td>
            </tr>
          )}
      </tbody>
    );
  }

  private getFlamescopeLink() {
    const { start, end } = this.state.previousRange!;
    const { numColumns, numRows } = this.props.heatMap!;
    const startPosition = normalizedToFlamescopePosition(
      start,
      numColumns,
      numRows
    );
    const endPosition = normalizedToFlamescopePosition(
      end,
      numColumns,
      numRows
    );

    return `${FLAMESCOPE_API_BASE}/#/heatmap/${
      this.props.heatMapId
    }/flamegraph/${startPosition}/${endPosition}/`;
  }

  // noinspection JSMethodCanBeStatic
  private renderSpinner() {
    return (
      <div className={styles.spinner}>
        <Spinner />
      </div>
    );
  }

  private renderGraphBody() {
    switch (this.props.heatMapStatus) {
      case "empty":
        return <div />;
      case "loading":
        return this.renderSpinner();
      case "loaded":
        if (this.props.heatMap) {
          return (
            <React.Suspense fallback={this.renderSpinner()}>
              <div className={styles.heatMap}>
                <HeatLineChart
                  {...this.props.heatMap}
                  hash={this.props.uuid}
                  previousRange={this.state.previousRange || undefined}
                  onRangeSelect={this.onRangeSelectWrap}
                />
              </div>
            </React.Suspense>
          );
        }
      // fallthrough if heatMap === null && status === "loaded"
      // noinspection FallThroughInSwitchStatementJS
      case "failed":
        return (
          <div className={styles.errorMessage}>
            <span>Failed to load</span>
          </div>
        );
    }
  }

  // noinspection JSMethodCanBeStatic
  private renderSpinnerForTree() {
    return (
      <>
        <div className={styles.spinnerForTree}>
          <Spinner />
        </div>
      </>
    );
  }

  private renderTreeBody() {
    switch (this.props.perfCallTreeStatus) {
      case "empty":
        return <div />;
      case "loading":
        return this.renderSpinnerForTree();
      case "loaded":
        if (this.props.perfCallTree) {
          const targetId = this.props.perfCallTree.keys().next().value; // root element first
          return (
            <React.Suspense fallback={this.renderSpinnerForTree()}>
              <div>
                <PerfCallTree
                  treeMap={this.props.perfCallTree}
                  targetId={targetId}
                  onSeeingCodeOf={this.onOpenCode}
                />
              </div>
            </React.Suspense>
          );
        }
      // fallthrough if tree === null && status === "loaded
      // noinspection FallThroughInSwitchStatementJS
      case "failed":
        return (
          <div className={styles.errorMessageForTree}>
            <span>Failed to load</span>
          </div>
        );
    }
  }

  private renderCodeReportBody() {
    const targetElement = this.props.perfCallTree![this.state.targetId!];
    return (
      <React.Suspense fallback={this.renderSpinner()}>
        <div>
          <CodeReport
            title={targetElement.label}
            lines={targetElement.code}
            firstLine={targetElement.firstLine}
            link={targetElement.snippetLink}
          />
        </div>
      </React.Suspense>
    );
  }

  private onInfoRowClick = () => {
    const willGraphOpen = !this.state.isGraphOpen;
    if (
      this.props.heatMapStatus === "empty" &&
      !this.props.heatMap &&
      willGraphOpen
    ) {
      this.props.getHeatMap(this.props.uuid, this.props.heatMapId);
    }
    this.setState({ isGraphOpen: willGraphOpen });
  };

  private onRangeSelectWrap = (start: number, end: number) => {
    this.props.onRangeSelect(this.props.uuid, this.props.heatMapId, start, end);
    this.setState({
      previousRange: { start, end },
      isTreeOpen: true,
      isCodeOpen: false
    });
  };

  private onOpenCode = (targetId: number) => {
    this.setState({ targetId, isCodeOpen: true });
  };
}

export default SnapshotItem;
