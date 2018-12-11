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
import { hot } from "react-hot-loader";
import { Route, Router, Switch } from "react-router";
import { NavLink } from "react-router-dom";
import styles from "./App.scss";
import { APP_NAME } from "./constants";
import Toastr from "./containers/Toastr";
import SnapshotPage from "./pages/SnapshotPage";
import { history } from "./store";

const ConfigPage = React.lazy(() =>
  import(/* webpackChunkName: "config-page" */ "./pages/ConfigPage")
);

const ReactTooltip = React.lazy(
  () => import(/* webpackChunkName: "react-tooltip"*/ "react-tooltip") as any
);

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
              <React.Suspense fallback={<div>Loading</div>}>
                <Switch>
                  <Route
                    exact={true}
                    component={SnapshotPage}
                    path="/"
                    default={true}
                  />
                  <Route component={ConfigPage} path="/config" />
                </Switch>
              </React.Suspense>
            </main>
          </Router>
        </div>
        <Toastr />
        <React.Suspense fallback={/* show nothing*/ null}>
          <ReactTooltip effect="solid" place="top" aria-haspopup="true" />
        </React.Suspense>
      </div>
    );
  }
}

export default hot(module)(App);
