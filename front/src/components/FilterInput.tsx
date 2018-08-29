import { Component, h } from "preact";
// @ts-ignore
import styles from "./FilterInput.scss";

interface IProperty {
  placeholder: string;
  onValueChange?(previous: string, current: string): void;
}

interface IState {
  value: string;
}

class FilterInput extends Component<IProperty, IState> {
  public render() {
    return (
      <div className={styles.wrap}>
        <span className={styles.icon} />
        <input
          type="text"
          className={styles.textBox}
          value={this.state.value}
          onKeyUp={this.change.bind(this)}
          placeholder={this.props.placeholder}
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
