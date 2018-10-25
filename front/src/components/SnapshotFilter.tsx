import * as React from "react";
import SelectorBase, { IProperty, IStyles } from "./SelectorBase";
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
    disabled: styles.disabled,
    searching: styles.searching,
    preSelected: styles.preSelected
  };
  return <SelectorBase styles={bindingStyles} {...props} />;
};
