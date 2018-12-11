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
import * as ReactTooltip from "react-tooltip";
import Spinner from "../Spinner";
import styles from "./PodCard.scss";

export interface IProperty {
  name: string;
  createdAt?: Date;
  app: string;
  environment: string;
  snapshots: Array<{ uuid: string; createdAt?: Date; link?: string }>;
  isAlive: boolean;
  isSaving?: boolean;

  onSaveButtonClick?(app: string, env: string, pod: string): void;
}

const initialState = { isOpen: false };

type State = Readonly<typeof initialState>;

export class PodCard extends React.Component<IProperty, State> {
  public readonly state: State = initialState;

  public componentDidMount() {
    ReactTooltip.rebuild();
  }

  public componentDidUpdate() {
    if (this.state.isOpen) {
      ReactTooltip.rebuild();
    }
  }

  public render() {
    const hashPart = this.props.name.startsWith(this.props.app)
      ? this.props.name.substring(this.props.app.length)
      : "";

    return (
      <div
        className={[
          styles.wrap,
          this.state.isOpen ? styles.isOpen : undefined
        ].join(" ")}
        data-testid="root"
        onClick={this.onClick}
      >
        <div className={styles.infoRoot} data-testid="info-root">
          <div className={styles.indicatorWrap}>
            <div
              className={[
                styles.aliveIndicator,
                this.props.isAlive ? styles.alive : styles.dead
              ].join(" ")}
            />
          </div>
          {hashPart ? (
            <span className={styles.name}>
              <span className={styles.appName}>{this.props.app}</span>
              <span className={styles.hashPart}>{hashPart}</span>
            </span>
          ) : (
            <span className={styles.name}>{this.props.name}</span>
          )}
          <div className={styles.info}>
            <span className={styles.environment}>{this.props.environment}</span>
            <span className={styles.createdAt}>
              {this.props.createdAt
                ? this.props.createdAt.toLocaleString()
                : "Unknown"}
            </span>
          </div>
          <div
            className={[
              styles.save,
              !this.props.onSaveButtonClick ? styles.disabled : undefined
            ].join(" ")}
            data-testid="save"
          >
            {this.props.isSaving ? (
              <div className={styles.spinner}>
                <Spinner />
              </div>
            ) : (
              <button className={styles.saveButton} data-testid="save-button">
                <span
                  className={styles.saveLabel}
                  onClick={this.onSave}
                  data-testid="save-button-body"
                  data-tip="Save snapshot"
                  data-class={styles.saveTooltip}
                >
                  Save
                </span>
              </button>
            )}
          </div>
        </div>
        {this.state.isOpen && (
          <div className={styles.snapshotsArea} data-testid="snapshot-area">
            {this.props.snapshots.length > 0 ? (
              <ul className={styles.snapshotList}>
                {this.props.snapshots
                  .sort(
                    (a, b) => b!.createdAt!.getTime() - a!.createdAt!.getTime()
                  )
                  .slice(0, 3)
                  .map(s => (
                    <li
                      key={s.uuid}
                      className={styles.snapshot}
                      data-testid="snapshot"
                    >
                      <span
                        className={styles.snapshotHash}
                        data-tip={s.uuid}
                        data-class={styles.snapshotHashTooltip}
                      >
                        {s.uuid.substr(0, 20)}
                        ...
                      </span>
                      <span
                        className={styles.snapshotDate}
                        data-testid="snapshot-date"
                      >
                        {s.createdAt ? s.createdAt.toLocaleString() : "Unknown"}
                      </span>
                      <a
                        className={styles.snapshotLink}
                        href={s.link}
                        target="_blank"
                        rel="noopener"
                      >
                        Flamescope
                      </a>
                    </li>
                  ))}
              </ul>
            ) : (
              <div
                className={styles.emptySnapshots}
                data-testid="empty-message"
              >
                No snapshots for this pod.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  private onSave = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    if (this.props.onSaveButtonClick) {
      this.props.onSaveButtonClick(
        this.props.app,
        this.props.environment,
        this.props.name
      );
    }
  };

  private onClick = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };
}

export default PodCard;
