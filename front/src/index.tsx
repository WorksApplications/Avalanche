import { h, render } from "preact";
// @ts-ignore
import styles from "./index.scss";

render(
  <div className={styles.foo}>
    <span>Hello, world!</span>
    {/* tslint:disable-next-line jsx-no-lambda */}
    <button onClick={() => alert("hi!")}>Click Me</button>
  </div>,
  document.body
);
