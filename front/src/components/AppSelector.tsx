import { Component, h } from "preact";
// @ts-ignore
import styles from "./AppSelector.scss";

interface IProperty {
  disabled?: boolean;
  options: Array<{ label: string; value: string }>;
  value?: string;
  onValueChanged?: (newValue: string | null) => void;
}

interface IState {
  isOpen: boolean;
  selected: string | null;
}

// TODO write test
class AppSelector extends Component<IProperty, IState> {
  public static defaultProps: Partial<IProperty> = {
    disabled: false
  };

  constructor(props: IProperty) {
    super(props);
    this.state = {
      isOpen: false,
      selected: props.value || null
    };
  }

  public render() {
    const optionsView = this.state.isOpen ? (
      <div className={styles.optionView}>
        {this.props.options.map(o => (
          <div
            className={styles.option}
            key={o.value}
            onMouseDown={this.setSelectingOption.bind(this, o.value)}
          >
            {o.label}
          </div>
        ))}
      </div>
    ) : null;
    const selectorString = this.state.selected || "Select landscape";

    return (
      <div className={styles.wrap}>
        <div
          className={[
            styles.selector,
            this.state.isOpen ? styles.opened : styles.closed
          ].join(" ")}
          onMouseDown={this.onMouseDown.bind(this)}
        >
          {selectorString}
        </div>
        {optionsView}
      </div>
    );
  }

  private setSelectingOption(value: string) {
    const newState = {
      isOpen: false,
      selected: value
    };
    this.setState(newState);
    if (this.props.onValueChanged) {
      this.props.onValueChanged(value);
    }
  }

  private onMouseDown(event: MouseEvent) {
    // if (this.props.onFocus && typeof this.props.onFocus === "function") {
    //   this.props.onFocus(this.state.isOpen);
    // }
    if (event.type === "mousedown" && event.button !== 0) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();

    if (!this.props.disabled) {
      this.setState({
        isOpen: !this.state.isOpen
      });
    }
  }
}

export default AppSelector;
