import { h } from "preact";
import SelectorBase, { IProperty, IStyles } from "./SelectorBase";
// @ts-ignore
import styles from "./SnapshotFilter.scss";

export default (props: IProperty) => {
  const bindingStyles: IStyles = {
    closed: styles.closed,
    opened: styles.opened,
    optionItem: styles.option,
    optionList: styles.optionView,
    placeholder: styles.placeholder,
    selector: styles.selector,
    wrap: styles.wrap,
    selected: styles.selected,
    unselectOption: styles.unselectOption,
    disabled: styles.disabled
  };
  return <SelectorBase styles={bindingStyles} {...props} />;
};
