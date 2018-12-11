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
/*
 * react-graph-vis
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Vincent Lecrubier
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
// Copied from https://raw.githubusercontent.com/crubier/react-graph-vis/9091a503ff2971b0645079c77891bc0bc7d8d656/src/index.js
//   and added some features
//  * events
//  * file-size reduction for our use

import React, { Component } from "react";
import defaultsDeep from "lodash-es/defaultsDeep";
import isEqual from "lodash-es/isEqual";
import differenceWith from "lodash-es/differenceWith";
import DataSet from "vis/lib/DataSet";
import Network from "vis/lib/network/Network";
import uuid from "uuid";
import PropTypes from "prop-types";

class Graph extends Component {
  constructor(props) {
    super(props);
    const { identifier } = props;
    this.updateGraph = this.updateGraph.bind(this);
    this.state = {
      identifier: identifier !== undefined ? identifier : uuid.v4()
    };
  }

  componentDidMount() {
    this.edges = new DataSet();
    this.edges.add(this.props.graph.edges);
    this.nodes = new DataSet();
    this.nodes.add(this.props.graph.nodes);
    this.updateGraph();
  }

  shouldComponentUpdate(nextProps, nextState) {
    let nodesChange = !isEqual(this.props.graph.nodes, nextProps.graph.nodes);
    let edgesChange = !isEqual(this.props.graph.edges, nextProps.graph.edges);
    let optionsChange = !isEqual(this.props.options, nextProps.options);
    let eventsChange = !isEqual(this.props.events, nextProps.events);

    if (nodesChange) {
      const idIsEqual = (n1, n2) => n1.id === n2.id;
      const nodesRemoved = differenceWith(
        this.props.graph.nodes,
        nextProps.graph.nodes,
        idIsEqual
      );
      const nodesAdded = differenceWith(
        nextProps.graph.nodes,
        this.props.graph.nodes,
        idIsEqual
      );
      const nodesChanged = differenceWith(
        differenceWith(nextProps.graph.nodes, this.props.graph.nodes, isEqual),
        nodesAdded
      );
      this.patchNodes({ nodesRemoved, nodesAdded, nodesChanged });
    }

    if (edgesChange) {
      const edgesRemoved = differenceWith(
        this.props.graph.edges,
        nextProps.graph.edges,
        isEqual
      );
      const edgesAdded = differenceWith(
        nextProps.graph.edges,
        this.props.graph.edges,
        isEqual
      );
      this.patchEdges({ edgesRemoved, edgesAdded });
    }

    if (optionsChange) {
      this.Network.setOptions(nextProps.options);
    }

    if (eventsChange) {
      let events = this.props.events || {};
      for (let eventName of Object.keys(events)) {
        this.Network.off(eventName, events[eventName]);
      }

      events = nextProps.events || {};
      for (let eventName of Object.keys(events)) {
        this.Network.on(eventName, events[eventName]);
      }
    }

    if (nodesChange || edgesChange || optionsChange || eventsChange) {
      if (this.props.onGraphUpdated) {
        this.props.onGraphUpdated();
      }
    }

    return false;
  }

  componentDidUpdate() {
    this.updateGraph();
  }

  patchEdges({ edgesRemoved, edgesAdded }) {
    this.edges.remove(edgesRemoved);
    this.edges.add(edgesAdded);
  }

  patchNodes({ nodesRemoved, nodesAdded, nodesChanged }) {
    this.nodes.remove(nodesRemoved);
    this.nodes.add(nodesAdded);
    this.nodes.update(nodesChanged);
  }

  updateGraph() {
    let container = document.getElementById(this.state.identifier);
    let defaultOptions = {
      physics: {
        stabilization: false
      },
      autoResize: false,
      edges: {
        smooth: false,
        color: "#000000",
        width: 0.5,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.5
          }
        }
      }
    };

    // merge user provied options with our default ones
    let options = defaultsDeep(defaultOptions, this.props.options);

    this.Network = new Network(
      container,
      Object.assign({}, this.props.graph, {
        edges: this.edges,
        nodes: this.nodes
      }),
      options
    );

    if (this.props.getNetwork) {
      this.props.getNetwork(this.Network);
    }

    if (this.props.getNodes) {
      this.props.getNodes(this.nodes);
    }

    if (this.props.getEdges) {
      this.props.getEdges(this.edges);
    }

    // Add user provied events to network
    let events = this.props.events || {};
    for (let eventName of Object.keys(events)) {
      this.Network.on(eventName, events[eventName]);
    }

    if (this.props.onGraphUpdated) {
      this.props.onGraphUpdated();
    }
  }

  render() {
    const { identifier } = this.state;
    const { style } = this.props;
    return React.createElement(
      "div",
      {
        id: identifier,
        style
      },
      identifier
    );
  }
}

Graph.defaultProps = {
  graph: {},
  style: { width: "100%", height: "100%" }
};
Graph.propTypes = {
  graph: PropTypes.object,
  style: PropTypes.object,
  getNetwork: PropTypes.func,
  getNodes: PropTypes.func,
  getEdges: PropTypes.func,
  onGraphUpdated: PropTypes.func
};

export default Graph;
