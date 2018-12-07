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
import styles from "./Link.scss";

interface IProperty {
  href: string;
}

const onClick = (e: React.MouseEvent) => {
  e.stopPropagation();
};

const Link: React.FunctionComponent<IProperty> = ({ children, ...props }) => {
  return (
    <span className={styles.wrap}>
      <a
        className={styles.anchor}
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {children}
      </a>
    </span>
  );
};
export default Link;
