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
