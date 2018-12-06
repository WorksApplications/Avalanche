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
            const line = l
              .map(x => (typeof x === "string" ? x : x.fragment))
              .join(" ");
            return (
              <React.Fragment key={this.props.title + i}>
                <pre className={styles.lineNumber}>
                  {this.props.firstLine! + i}
                </pre>
                <pre className={styles.codeLine}>{line}</pre>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }
}

export default CodeReport;
