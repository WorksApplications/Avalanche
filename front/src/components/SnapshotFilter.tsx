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
