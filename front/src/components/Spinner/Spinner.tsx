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
import styles from "./Spinner.scss";

const Spinner: React.FunctionComponent = () => (
  <svg className={styles.spinner} viewBox="0 0 50 50" data-testid="spinner">
    <circle
      className={styles.dash}
      fill="none"
      strokeWidth="4"
      strokeLinecap="round"
      cx="25"
      cy="25"
      r="20"
      strokeMiterlimit="10"
    />
  </svg>
);
export default Spinner;
