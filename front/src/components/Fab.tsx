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
import styles from "./Fab.scss";

interface IProperty {
  tooltip: string;
  icon: string;
  onClick(): void;
}

export const Fab: React.FunctionComponent<IProperty> = ({ ...props }) => (
  <div
    className={styles.wrap}
    onClick={props.onClick}
    data-tip={props.tooltip}
    data-place="left"
    data-class={styles.tooltip}
  >
    <div className={styles.innerWrap}>
      <i className={["material-icons", styles.icon].join(" ")}>{props.icon}</i>
    </div>
  </div>
);
export default Fab;
