import { Component, h } from "preact";

export interface IStyles {
  optionList?: string;
  optionItem?: string;
  wrap?: string;
  selector?: string;
  opened?: string;
  closed?: string;
  placeholder?: string;
  selected?: string;
}

export interface IProperty {
  disabled?: boolean;
  options: Array<{ label: string; value: string }>;
  value?: string;
  onValueChanged?: (newValue: string | null) => void;
  styles?: IStyles;
  placeholder: string;
}

interface IState {
  isOpen: boolean;
  selected: string | null;
}

// TODO write test
class SelectorBase extends Component<IProperty, IState> {
  public static defaultProps: Partial<IProperty> = {
    disabled: false,
    styles: {
      closed: "closed",
      opened: "opened"
    }
  };

  private container: HTMLElement | null = null;

  constructor(props: IProperty) {
    super(props);
    this.state = {
      isOpen: false,
      selected: props.value || null
    };
  }

  public render() {
    const styles = this.props.styles!;
    const optionsView = this.state.isOpen ? (
      <ul className={styles.optionList}>
        {this.props.options.map(o => (
          <li
            className={[
              styles.optionItem,
              o.value === this.state.selected ? styles.selected : undefined
            ].join(" ")}
            key={o.value}
            onMouseDown={this.setSelectingOption.bind(this, o.value)}
          >
            {o.label}
          </li>
        ))}
      </ul>
    ) : null;
    const selectorString = this.state.selected || this.props.placeholder;

    return (
      <div className={styles.wrap} ref={this.getContainer.bind(this)}>
        <div
          className={[
            this.props.styles!.selector,
            this.state.isOpen ? styles.opened : styles.closed,
            this.state.selected ? "" : styles.placeholder
          ].join(" ")}
          onMouseDown={this.onMouseDown.bind(this)}
        >
          {selectorString}
        </div>
        {optionsView}
      </div>
    );
  }

  public componentDidMount() {
    document.addEventListener("click", this.onClick, true);
  }

  public componentWillUnmount() {
    document.removeEventListener("click", this.onClick, true);
  }

  private getContainer(ref: HTMLElement) {
    this.container = ref;
  }

  private onClick = (e: Event) => {
    if (e.target instanceof Node) {
      if (this.container && !this.container.contains(e.target)) {
        this.setState({ isOpen: false });
      }
    }
  };

  private setSelectingOption(value: string) {
    if (this.state.selected === value) {
      this.setState({ isOpen: false });
      return;
    }
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

export default SelectorBase;
