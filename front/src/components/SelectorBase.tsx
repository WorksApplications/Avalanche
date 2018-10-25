import * as React from "react";

export interface IStyles {
  optionList?: string;
  optionItem?: string;
  wrap?: string;
  selector?: string;
  opened?: string;
  closed?: string;
  placeholder?: string;
  selected?: string;
  unselectOption?: string;
  disabled?: string;
  searching?: string;
  preSelected?: string;
}

export interface IProperty {
  disabled?: boolean;
  options: Array<{ label: string; value: string }>;
  selectedValue?: string | null;
  onValueChanged?: (newValue: string | null) => void;
  styles?: IStyles;
  placeholder: string;
  unselectOptionLabel?: string;
}

interface IState {
  isOpen: boolean;
  searchingWord: string;
  preSelectingIndex: number;
}

class SelectorBase extends React.Component<IProperty, IState> {
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
      searchingWord: "",
      preSelectingIndex: -1
    };
  }

  public render() {
    const styles = this.props.styles!;
    const optionsView = this.state.isOpen && (
      <ul className={styles.optionList}>
        {this.props.unselectOptionLabel && (
          <li
            className={[styles.optionItem, styles.unselectOption].join(" ")}
            key={"!!!!"}
            onClick={this.setSelectingOption.bind(this, null)}
          >
            {this.props.unselectOptionLabel}
          </li>
        )}
        {this.props.options
          .filter(o => o.label.startsWith(this.state.searchingWord))
          .map((o, i) => (
            <li
              className={[
                styles.optionItem,
                o.value === this.props.selectedValue
                  ? styles.selected
                  : undefined,
                i === this.state.preSelectingIndex
                  ? styles.preSelected
                  : undefined
              ].join(" ")}
              key={o.value}
              onClick={this.setSelectingOption.bind(this, o.value)}
            >
              {o.label}
            </li>
          ))}
      </ul>
    );
    const selectorString =
      this.state.searchingWord ||
      this.props.selectedValue ||
      this.props.placeholder;

    return (
      <div
        className={[
          styles.wrap,
          this.props.disabled ? styles.disabled : undefined
        ].join(" ")}
        ref={this.getContainer.bind(this)}
      >
        <div
          className={[
            styles!.selector,
            this.state.isOpen ? styles.opened : styles.closed,
            this.state.searchingWord
              ? styles.searching
              : this.props.selectedValue
                ? ""
                : styles.placeholder
          ].join(" ")}
          onClick={this.onClickSelector.bind(this)}
        >
          {selectorString}
        </div>
        {!this.props.disabled && optionsView}
      </div>
    );
  }

  public componentDidMount() {
    document.addEventListener("click", this.onClickOutside, true);
    document.addEventListener("keypress", this.onKeyPress, true);
    document.addEventListener("keydown", this.onKeyDown, true);
  }

  public componentWillUnmount() {
    document.removeEventListener("click", this.onClickOutside, true);
    document.removeEventListener("keypress", this.onKeyPress, true);
    document.removeEventListener("keydown", this.onKeyDown, true);
  }

  private getContainer(ref: HTMLElement) {
    this.container = ref;
  }

  private onClickOutside = (e: Event) => {
    if (e.target instanceof Node) {
      if (this.container && !this.container.contains(e.target)) {
        this.setState({ isOpen: false });
        this.setState({ searchingWord: "" });
      }
    }
  };

  private onKeyPress = (e: KeyboardEvent) => {
    if (this.state.isOpen && e.key !== "Enter") {
      this.setState((s: IState) => ({
        searchingWord: s.searchingWord + e.key
      }));
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.state.isOpen) {
      switch (e.code) {
        case "Escape":
          this.setState({ searchingWord: "" });
          break;
        case "Backspace":
          this.setState((s: IState) => ({
            searchingWord: s.searchingWord.substring(
              0,
              s.searchingWord.length - 1
            )
          }));
          break;
        case "Enter":
          this.setSelectingOption(
            this.props.options.filter(o =>
              o.label.startsWith(this.state.searchingWord)
            )[this.state.preSelectingIndex].value
          );
          this.setState({ preSelectingIndex: -1, searchingWord: "" });
          break;
        case "ArrowDown":
          this.setState((s: IState) => {
            const i = s.preSelectingIndex + 1;
            const optionLength = this.props.options.filter(o =>
              o.label.startsWith(this.state.searchingWord)
            ).length;
            return {
              preSelectingIndex: i > optionLength - 1 ? optionLength - 1 : i
            };
          });
          break;
        case "ArrowUp":
          this.setState((s: IState) => {
            const i = s.preSelectingIndex - 1;
            return {
              preSelectingIndex: i < 0 ? 0 : i
            };
          });
          break;
      }
    }
  };

  private setSelectingOption(value: string) {
    if (this.props.selectedValue === value) {
      this.setState({ isOpen: false });
      return;
    }
    const newState = {
      isOpen: false,
      selected: value,
      searchingWord: "",
      preSelectingIndex: -1
    };
    this.setState(newState);
    if (this.props.onValueChanged) {
      this.props.onValueChanged(value);
    }
  }

  private onClickSelector(event: MouseEvent) {
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
