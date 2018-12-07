/*
 * Copyright (c) 2017 Works Applications Co., Ltd.
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
import styles from "./FilterInput.scss";

interface IProperty {
  placeholder: string;
  onValueChange?(previous: string, current: string): void;
}

const initialState = {
  value: ""
};

type State = Readonly<typeof initialState>;

export class FilterInput extends React.Component<IProperty, State> {
  public readonly state: State = initialState;

  public render() {
    return (
      <div className={styles.wrap}>
        <i className={[styles.icon, "material-icons"].join(" ")}>filter_list</i>
        <input
          type="text"
          className={styles.textBox}
          value={this.state.value}
          onKeyUp={this.onChange}
          placeholder={this.props.placeholder}
          onChange={this.onChange}
        />
      </div>
    );
  }

  private onChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) => {
    const newValue = (e.target as HTMLInputElement).value; // questionable...
    if (newValue !== this.state.value) {
      if (this.props.onValueChange) {
        this.props.onValueChange(this.state.value, newValue);
      }
      this.setState({ value: newValue });
    }
  };
}

export default FilterInput;
