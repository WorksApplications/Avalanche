import { FunctionalComponent, h } from "preact";
// @ts-ignore
import styles from "./Link.scss";

interface IProperty {
  href: string;
}

const Link: FunctionalComponent<IProperty> = ({ children, ...props }) => (
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
