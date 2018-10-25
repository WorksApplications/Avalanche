import * as React from "react";
import styles from "./FilterInput.scss";

interface IProperty {
  placeholder: string;
  onValueChange?(previous: string, current: string): void;
}

interface IState {
  value: string;
}

class FilterInput extends React.Component<IProperty, IState> {
  constructor(props: IProperty) {
    super(props);

    this.state = {
      value: ""
    };
  }

  public render() {
    return (
      <div className={styles.wrap}>
        <i className={[styles.icon, "wap-icon-filter"].join(" ")} />
        <input
          type="text"
          className={styles.textBox}
          value={this.state.value}
          onKeyUp={this.change.bind(this)}
          placeholder={this.props.placeholder}
          onChange={this.change.bind(this)}
        />
      </div>
    );
  }

  private change(e: Event) {
    const newValue = (e.target as HTMLInputElement).value;
    if (newValue !== this.state.value) {
      if (this.props.onValueChange) {
        this.props.onValueChange(this.state.value, newValue);
      }
      this.setState({ value: newValue });
    }
  }
}

export default FilterInput;
