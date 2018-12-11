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
import styles from "./CodeReport.scss";

export interface IProperty {
  title: string;
  firstLine?: number;
  lines: Array<Array<string | { fragment: string }>>;
  link?: string;
}

export class CodeReport extends React.Component<IProperty> {
  public static defaultProps: Partial<IProperty> = {
    firstLine: 1
  };

  public render() {
    return (
      <div className={styles.wrap}>
        <div className={styles.header}>
          <span className={styles.title}>{this.props.title}</span>
          {this.props.link && (
            <>
              <span>&nbsp;&mdash;&nbsp;</span>
              <a
                className={styles.link}
                href={this.props.link}
                target="_blank"
                rel="noopener"
              >
                Code
              </a>
            </>
          )}
        </div>
        <div className={styles.codeView}>
          {this.props.lines.map((l, i) => {
            return (
              <React.Fragment key={this.props.title + i}>
                <pre className={styles.lineNumber}>
                  {this.props.firstLine! + i}
                </pre>
                <pre className={styles.codeLine}>
                  {l.map(e => {
                    if (typeof e === "string") {
                      return <span>{e}</span>;
                    } else {
                      return <span>{e.fragment}</span>;
                    }
                  })}
                </pre>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }
}

export default CodeReport;
