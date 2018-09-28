import { Component, h } from "preact";
import AliveIndicator from "./AliveIndicator";
// @ts-ignore
import styles from "./PodCard.scss";

export interface IProperty {
  name: string;
  createdAt: string;
  app: string;
  environment: string;
  snapshots: Array<{ uuid: string; createdAt?: Date; link?: string }>;
  isAlive: boolean;

  onSaveButtonClick?(): void;
}

export interface IState {
  isOpen: boolean;
}

class PodCard extends Component<IProperty, IState> {
  constructor() {
    super();

    this.state = { isOpen: false };
  }

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
        onClick={this.onClick.bind(this)}
      >
        <div>
          <div
            className={[
              styles.saveButton,
              !this.props.onSaveButtonClick ? styles.disabled : undefined
            ].join(" ")}
            onMouseDown={onSave}
          >
            <span className={styles.saveTooltip}>Save snapshot</span>
            Save
          </div>
          <div className={styles.indicatorWrap}>
            <div className={styles.aliveIndicator}>
              <AliveIndicator isAlive={this.props.isAlive} />
            </div>
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
            <span className={styles.createdAt}>{this.props.createdAt}</span>
          </div>
        </div>
        {this.state.isOpen && (
          <div className={styles.snapshotsArea}>
            {this.props.snapshots.length > 0 ? (
              <ul className={styles.snapshotList}>
                {this.props.snapshots.slice(0, 3).map(s => (
                  <li className={styles.snapshot}>
                    <span className={styles.snapshotHash}>
                      <span className={styles.snapshotHashPopover}>
                        {s.uuid}
                      </span>
                      {s.uuid.substr(0, 20)}
                      ...
                    </span>
                    <span className={styles.snapshotDate}>
                      {s.createdAt && s.createdAt.toLocaleString()}
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
              <div className={styles.emptySnapshots}>
                No snapshots for this pod.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  private onClick() {
    const willOpen = !this.state.isOpen;
    this.setState({ isOpen: willOpen });
  }
}

export default PodCard;
