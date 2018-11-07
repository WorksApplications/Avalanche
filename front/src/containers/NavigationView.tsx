import * as React from "react";
// tslint:disable-next-line:no-submodule-imports
import { NavLink } from "react-router-dom";
import styles from "./NavigationView.scss";

export class NavigationView extends React.Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.viewList}>
          <NavLink
            exact={true}
            activeClassName={styles.selected}
            className={styles.viewItem}
            to="/"
          >
            Snapshots
          </NavLink>
        </div>
        <div className={styles.controlList}>
          <NavLink
            activeClassName={styles.selected}
            className={styles.viewItem}
            to={"/config"}
          >
            Config
          </NavLink>
        </div>
      </div>
    );
  }
}

export default NavigationView;
