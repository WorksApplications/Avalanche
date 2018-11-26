import * as React from "react";
import { hot } from "react-hot-loader";
import { Route, Router, Switch } from "react-router";
import { NavLink } from "react-router-dom";
import styles from "./App.scss";
import { APP_NAME } from "./constants";
import Toastr from "./containers/Toastr";
import ConfigPage from "./pages/ConfigPage";
import SnapshotPage from "./pages/SnapshotPage";
import { history } from "./store";

class App extends React.Component {
  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.title}>
          <span className={styles.brand}>{APP_NAME}</span>
          <NavLink
            exact={true}
            activeClassName={styles.selected}
            className={styles.viewItem}
            to="/"
          >
            Snapshots
          </NavLink>
          <NavLink
            activeClassName={styles.selected}
            className={[styles.viewItem, styles.config].join(" ")}
            to={"/config"}
          >
            Config
          </NavLink>
        </div>
        <div className={styles.content}>
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
        <Toastr />
      </div>
    );
  }
}

export default hot(module)(App);
