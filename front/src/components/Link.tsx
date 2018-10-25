import * as React from "react";
import styles from "./Link.scss";

interface IProperty {
  href: string;
}

const Link: React.StatelessComponent<IProperty> = ({ children, ...props }) => (
  <span className={styles.wrap}>
    <a
      className={styles.anchor}
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  </span>
);
export default Link;
