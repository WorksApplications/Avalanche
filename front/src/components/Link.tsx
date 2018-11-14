import * as React from "react";
import styles from "./Link.scss";

interface IProperty {
  href: string;
}

const onClick = (e: React.MouseEvent) => {
  e.stopPropagation();
};

const Link: React.StatelessComponent<IProperty> = ({ children, ...props }) => {
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
