import * as React from "react";
import { Route, Router, Switch } from "react-router-dom";
import ConfigPage from "../pages/ConfigPage";
import SnapshotPage from "../pages/SnapshotPage";
import { history } from "../store";
import NavigationView from "./NavigationView";
import styles from "./Workspace.scss";

export class Workspace extends React.Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <nav className={styles.nav}>
          <NavigationView />
        </nav>
        <Router history={history}>
          <main className={styles.main}>
            <Switch>
              <Route
                exact={true}
                component={SnapshotPage}
                path="/"
                default={true}
              />
              <Route component={ConfigPage} path="/config" />
            </Switch>
          </main>
        </Router>
      </div>
    );
  }
}

export default Workspace;
