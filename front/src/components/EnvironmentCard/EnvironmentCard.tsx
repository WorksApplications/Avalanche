/*
 * Copyright (c) 2017 Works Applications Co., Ltd.
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
import * as ReactTooltip from "react-tooltip";
import styles from "./EnvironmentCard.scss";

export interface IProperty {
  name: string;
  version?: string;
  kind: "unconfigured" | "configured" | "observed";

  switchEnabled?(): void;

  onEdit?(): void;
}

export class EnvironmentCard extends React.Component<IProperty> {
  public componentDidMount() {
    ReactTooltip.rebuild();
  }

  public render() {
    let kind: string | null = null;
    switch (this.props.kind) {
      case "unconfigured":
        kind = styles.unconfigured;
        break;
      case "configured":
        kind = styles.configured;
        break;
      case "observed":
        kind = styles.observed;
        break;
    }
    return (
      <div className={[styles.wrap, kind].join(" ")} data-testid="root">
        <div className={styles.name}>{this.props.name}</div>
        {this.props.version && (
          <div className={styles.version}>version {this.props.version}</div>
        )}
        {(this.props.kind === "configured" ||
          this.props.kind === "observed") && (
          <a
            className={styles.switchEnabled}
            onClick={this.props.switchEnabled}
          >
            Observation is{" "}
            {this.props.kind === "observed" ? "Enabled" : "Disabled"}
          </a>
        )}
        <button
          className={styles.edit}
          onClick={this.props.onEdit}
          role="button"
          data-testid="edit-button"
        >
          <span
            className={styles.editLabel}
            data-tip="Edit this environment"
            data-class={styles.editTooltip}
          >
            Edit
          </span>
        </button>
      </div>
    );
  }
}

export default EnvironmentCard;
