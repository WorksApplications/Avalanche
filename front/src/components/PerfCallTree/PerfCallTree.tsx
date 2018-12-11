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
// @ts-ignore
import Popover from "react-popover";
import Graph from "../ReactGraphVisCustom";
import styles from "./PerfCallTree.scss";

export interface ITreeElement {
  parentId?: number;
  childIds: number[];
  label: string;
  totalRatio: number;
  immediateRatio: number;
  relativeRatio: number;
  id: number;
  hasCode: boolean;
}

export interface IProperty {
  treeMap: ITreeElement[];
  targetId?: number;

  onSeeingCodeOf?(targetId: number): void;
}

type LabelLevel = "normal" | "classOnly";

function generateGraph(
  treeMap: ITreeElement[],
  root: ITreeElement,
  targetId: number
) {
  const nodes: any[] = [];
  const edges: any[] = [];

  function registerElement(
    elem: ITreeElement,
    labelLevel: LabelLevel,
    hierarchicalLevel: number
  ) {
    const isFirst = typeof elem.parentId === "undefined";
    const tokens = elem.label.split("/");

    const label =
      labelLevel === "classOnly"
        ? tokens[tokens.length - 1]
        : tokens.length > 3
        ? `${tokens[0]}/${tokens[1]}/... ${tokens[tokens.length - 1]}`
        : elem.label;
    const edgeLabel = `${(elem.relativeRatio * 100).toFixed(2)}%`;
    // const tooltip = `Consume ${(elem.relativeRatio * 100).toFixed(2)}% (${(
    //   elem.totalRatio * 100
    // ).toFixed(2)}% in this range)`;

    nodes.push({
      id: elem.id,
      label,
      group: elem.relativeRatio > 0.6 ? "important" : "normal",
      first: isFirst,
      level: hierarchicalLevel
    });
    if (!isFirst) {
      edges.push({ from: elem.parentId, to: elem.id, label: edgeLabel });
    }
  }

  if (root.id === targetId) {
    registerElement(root, "normal", 0);
    for (const c of root.childIds
      .map(i => treeMap[i])
      .filter(x => x.relativeRatio > 0.01)) {
      registerElement(c, "classOnly", 2);
    }
  } else {
    registerElement(root, "normal", 0);

    // left siblings
    for (const s of root.childIds
      .filter(i => i < root.id)
      .map(i => treeMap[i])) {
      registerElement(s, "classOnly", 2);
    }

    const target = treeMap[targetId];
    registerElement(target, "normal", 2);

    // children of target
    for (const c of target.childIds
      .map(i => treeMap[i])
      .filter(x => x.relativeRatio > 0.01)) {
      registerElement(c, "classOnly", 5);
    }

    // right siblings
    for (const s of root.childIds
      .filter(i => i > root.id)
      .map(i => treeMap[i])
      .filter(x => x.relativeRatio > 0.01)) {
      registerElement(s, "classOnly", 2);
    }
  }

  return { nodes, edges };
}

const visOptions = {
  height: "200",
  edges: {
    chosen: false
  },
  nodes: {
    borderWidth: 1,
    borderWidthSelected: 1,
    shape: "box",
    color: {
      border: "#d6d9db", // hsl(210, 7, 85)
      background: "#ffffff", // white
      highlight: {
        border: "#3d8af5", // hsl(215, 90, 60)
        background: "#ffffff" // white
      },
      hover: {
        border: "#d6d9db",
        background: "#ffffff"
      }
    },
    font: {
      color: "#333333", // hsl(0, 0, 20)
      face: "Roboto"
    },
    labelHighlightBold: false,
    shadow: {
      enabled: true,
      color: "rgba(0, 0, 0, 0.12)",
      size: 5,
      x: 0,
      y: 1
    }
  },
  groups: {
    important: {
      color: {
        border: "#d6d9db", // hsl(210, 7, 85)
        background: "#ffffff", // white
        highlight: {
          border: "#3d8af5", // hsl(215, 90, 60)
          background: "#ffffff" // white
        },
        hover: {
          border: "#c8ccd0", // hsl(210, 7, 80)
          background: "#ffffff" // white
        }
      }
    },
    normal: {
      color: {
        border: "#e3e6e8", // hsl(210, 8, 90)
        background: "#ffffff", // white
        highlight: {
          border: "#3d8af5", // hsl(215, 90, 60)
          background: "#ffffff" // white
        },
        hover: {
          border: "#d6d9db", // hsl(210, 7, 85)
          background: "#ffffff" // white
        }
      }
    }
  },
  layout: {
    hierarchical: {
      enabled: true,
      levelSeparation: 30,
      nodeSpacing: 300,
      sortMethod: "directed",
      blockShifting: false,
      edgeMinimization: true,
      parentCentralization: true
    }
  },
  interaction: {
    dragNodes: false,
    selectConnectedEdges: false,
    hover: true,
    hoverConnectedEdges: false
  },
  physics: {
    enabled: false
  }
};

const initialState = {
  targetId: null as number | null,
  tooltip: {
    message: null as React.ReactNode,
    offsetLeft: 0,
    offsetTop: 0,
    showing: false
  }
};
type State = Readonly<typeof initialState>;

class PerfCallTree extends React.Component<IProperty, State> {
  public static getDerivedStateFromProps(
    nextProps: IProperty,
    prevState: State
  ): Partial<State> | null {
    if (prevState.targetId === null) {
      return {
        targetId:
          typeof nextProps.targetId !== "undefined" ? nextProps.targetId : null
      };
    } else {
      return null;
    }
  }

  public readonly state: State = initialState;

  private popoverTimeout: NodeJS.Timeout | null = null;

  private wrapRef = React.createRef<HTMLDivElement>();

  private network: any = null;
  private edges: any = null;

  private draggedAfterFocus = false;

  public render() {
    if (this.state.targetId === null) {
      return <ul className={styles.wrap} />;
    }

    let rootElement = this.props.treeMap[this.state.targetId];
    if (typeof rootElement.parentId !== "undefined") {
      rootElement = this.props.treeMap[rootElement.parentId];
    }

    const graph = generateGraph(
      this.props.treeMap,
      rootElement,
      this.state.targetId
    );

    const events = {
      selectNode: (arg: any) => {
        this.draggedAfterFocus = false;
        this.setState({ targetId: arg.nodes[0] });
      },
      selectEdge: (arg: any) => {
        const edge = this.edges._data[arg.edges[0]];
        if (edge.from === this.state.targetId) {
          this.draggedAfterFocus = false;
          this.setState({ targetId: edge.to });
        } else if (edge.to === this.state.targetId) {
          this.draggedAfterFocus = false;
          this.setState({ targetId: edge.from });
        }
      },
      hoverNode: (arg: any) => {
        if (this.popoverTimeout !== null) {
          clearTimeout(this.popoverTimeout);
          this.popoverTimeout = null;
        }

        const hoveringElement = this.props.treeMap[arg.node];

        // TODO centralize tooltip
        this.setState({
          tooltip: {
            message: (
              <>
                <h1 className={styles.popoverHeader}>
                  {hoveringElement.label}
                </h1>
                <button
                  className={styles.seeCode}
                  onClick={this.onSeeCodeClick(hoveringElement.id)}
                  disabled={!hoveringElement.hasCode}
                >
                  See code
                </button>
              </>
            ),
            offsetTop: arg.event.offsetY - 15,
            offsetLeft:
              arg.event.offsetX - this.wrapRef.current!.clientWidth / 2,
            showing: true
          }
        });
      },
      blurNode: () => {
        this.popoverTimeout = setTimeout(() => {
          this.setState(s => ({ tooltip: { ...s.tooltip, showing: false } }));
        }, 300);
      },
      dragEnd: () => {
        this.draggedAfterFocus = true;
      }
    };

    return (
      <div className={styles.wrap} ref={this.wrapRef}>
        {/*for Filter*/}
        <svg width="0" height="0" className={styles.shadow}>
          <filter id="dropshadow" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
            <feOffset dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </svg>
        <Popover
          body={
            <div
              className={styles.popoverContent}
              onMouseEnter={this.onPopoverMouseEnter}
              onMouseLeave={this.onPopoverMouseLeave}
            >
              {this.state.tooltip.message}
            </div>
          }
          className={styles.popover}
          isOpen={this.state.tooltip.showing}
          place="above"
        >
          <div
            style={{
              left: this.state.tooltip.offsetLeft,
              top: this.state.tooltip.offsetTop
            }}
          />
        </Popover>
        <Graph
          graph={graph}
          options={visOptions}
          events={events}
          getNetwork={this.storeNetwork}
          getEdges={this.storeEdges}
          onGraphUpdated={this.onGraphUpdated}
        />
      </div>
    );
  }

  private onSeeCodeClick = (targetId: number) => () => {
    if (this.props.onSeeingCodeOf) {
      this.props.onSeeingCodeOf(targetId);
    }
  };

  private onPopoverMouseEnter = () => {
    if (this.popoverTimeout !== null) {
      clearTimeout(this.popoverTimeout);
      this.popoverTimeout = null;
    }
  };

  private onPopoverMouseLeave = () => {
    if (this.popoverTimeout === null) {
      this.popoverTimeout = setTimeout(() => {
        this.setState(s => ({ tooltip: { ...s.tooltip, showing: false } }));
      }, 300);
    }
  };

  private storeNetwork = (n: any) => {
    this.network = n;
  };

  private storeEdges = (e: any) => {
    this.edges = e;
  };

  private onGraphUpdated = () => {
    if (!this.draggedAfterFocus) {
      this.network.focus(this.state.targetId);
      this.network.selectNodes([this.state.targetId], false);
    }
  };
}

export default PerfCallTree;
