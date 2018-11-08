import * as React from "react";
import { Route, Router, Switch } from "react-router-dom";

import { history } from "../store";
import NavigationView from "./NavigationView";
import styles from "./Workspace.scss";

// @ts-ignore
const SnapshotPage = React.lazy(() =>
  import(/* webpackChunkName: "snapshot-page" */ "../pages/SnapshotPage")
);
// @ts-ignore
const ConfigPage = React.lazy(() =>
  import(/* webpackChunkName: "config-page" */ "../pages/ConfigPage")
);

// @ts-ignore
const Suspense = React.Suspense;

export class Workspace extends React.Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <nav className={styles.nav}>
          <NavigationView />
        </nav>
        <Router history={history}>
          <main className={styles.main}>
            <Suspense
              fallback={<div className={styles.fallback}>Loading...</div>}
            >
              <Switch>
                <Route
                  exact={true}
                  component={SnapshotPage}
                  path="/"
                  default={true}
                />
                <Route component={ConfigPage} path="/config" />
              </Switch>
            </Suspense>
          </main>
        </Router>
      </div>
    );
  }
}

export default Workspace;
