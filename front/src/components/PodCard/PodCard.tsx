import * as React from "react";
import styles from "./PodCard.scss";

export interface IProperty {
  name: string;
  createdAt?: Date;
  app: string;
  environment: string;
  snapshots: Array<{ uuid: string; createdAt?: Date; link?: string }>;
  isAlive: boolean;
  isSaving?: boolean;

  onSaveButtonClick?(): void;
}

const initialState = { isOpen: false };

type State = Readonly<typeof initialState>;

export class PodCard extends React.Component<IProperty, State> {
  public readonly state: State = initialState;

  public render() {
    const onSave = this.props.onSaveButtonClick || (() => undefined);
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
        <div
          className={[
            styles.save,
            !this.props.onSaveButtonClick ? styles.disabled : undefined
          ].join(" ")}
          data-testid="save"
        >
          {this.props.isSaving ? (
            <i
              className={[styles.spinner, "wap-icon-spinner"].join(" ")}
              data-testid="spinner"
            />
          ) : (
            <button className={styles.saveButton} data-testid="save-button">
              <span className={styles.saveTooltip}>Save snapshot</span>
              <span
                className={styles.saveLabel}
                onClick={onSave}
                data-testid="save-button-body"
              >
                Save
              </span>
            </button>
          )}
        </div>
        <div data-testid="info-root">
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
          {this.state.isOpen && (
            <div className={styles.snapshotsArea} data-testid="snapshot-area">
              {this.props.snapshots.length > 0 ? (
                <ul className={styles.snapshotList}>
                  {this.props.snapshots
                    .sort(
                      (a, b) =>
                        b!.createdAt!.getTime() - a!.createdAt!.getTime()
                    )
                    .slice(0, 3)
                    .map(s => (
                      <li
                        key={s.uuid}
                        className={styles.snapshot}
                        data-testid="snapshot"
                      >
                        <span className={styles.snapshotHash}>
                          <span className={styles.snapshotHashPopover}>
                            {s.uuid}
                          </span>
                          {s.uuid.substr(0, 20)}
                          ...
                        </span>
                        <span
                          className={styles.snapshotDate}
                          data-testid="snapshot-date"
                        >
                          {s.createdAt
                            ? s.createdAt.toLocaleString()
                            : "Unknown"}
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
      </div>
    );
  }

  private onClick = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };
}

export default PodCard;
