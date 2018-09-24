import { Component, h } from "preact";
// tslint:disable-next-line:no-submodule-imports
import { Link } from "preact-router/match";
// @ts-ignore
import styles from "./NavigationView.scss";

class NavigationView extends Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.viewList}>
          <Link
            activeClassName={styles.selected}
            className={styles.viewItem}
            href="/"
          >
            Snapshots
          </Link>
        </div>
        <div className={styles.controlList}>
          <Link
            activeClassName={styles.selected}
            className={styles.viewItem}
            href={"/config"}
          >
            Config
          </Link>
        </div>
      </div>
    );
  }
}

export default NavigationView;
