import { h } from "preact";
// @ts-ignore
import styles from "./AppSelector.scss";
import SelectorBase, { IProperty, IStyles } from "./SelectorBase";

export default (props: IProperty) => {
  const bindingStyles: IStyles = {
    closed: styles.closed,
    opened: styles.opened,
    optionItem: styles.option,
    optionList: styles.optionView,
    selector: styles.selector,
    wrap: styles.wrap,
    selected: styles.selected
  };
  return <SelectorBase styles={bindingStyles} {...props} />;
};
