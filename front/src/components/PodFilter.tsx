import * as React from "react";
import styles from "./PodFilter.scss";

interface IProperty {
  placeholder: string;

  onValueChange?(previous: string, current: string): void;
}

const initialState = {
  value: ""
};

type State = Readonly<typeof initialState>;

export class PodFilter extends React.Component<IProperty, State> {
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

export default PodFilter;
