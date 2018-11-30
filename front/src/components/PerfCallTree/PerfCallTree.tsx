import * as React from "react";
import styles from "./PerfCallTree.scss";

export interface ITreeElement {
  parentId?: number;
  childIds: number[];
  label: string;
  totalRatio: number;
  immediateRatio: number;
  relativeRatio: number;
  id: number;
}

export interface IProperty {
  treeMap: ITreeElement[];
  targetId?: number;

  onTargetChanged?(targetId: number): void;
}

type RenderingLabelLevel = "normal" | "classOnly";

const initialState = { targetId: null as number | null };
type State = Readonly<typeof initialState>;

class PerfCallTree extends React.Component<IProperty, State> {
  public static getDerivedStateFromProps(
    nextProps: IProperty,
    prevState: State
  ): State | null {
    if (prevState.targetId === null) {
      return {
        targetId:
          typeof nextProps.targetId !== "undefined" ? nextProps.targetId : null
      };
    } else {
      return null;
    }
  }

  public readonly state: State = initialState;

  public render() {
    if (this.state.targetId === null) {
      return <ul className={styles.wrap} />;
    }
    const targetElement = this.props.treeMap[this.state.targetId];
    const parentElement =
      typeof targetElement.parentId !== "undefined"
        ? this.props.treeMap[targetElement.parentId]
        : null;

    const leftElements = parentElement
      ? parentElement.childIds
          .filter(i => i < targetElement.id)
          .map(c => this.props.treeMap[c])
      : [];
    const rightElements = parentElement
      ? parentElement.childIds
          .filter(i => i > targetElement.id)
          .map(c => this.props.treeMap[c])
      : [];
    const childElements = targetElement.childIds.map(
      c => this.props.treeMap[c]
    );

    return (
      <ul className={styles.wrap}>
        <li>
          {parentElement ? (
            this.renderElement(parentElement, "normal")
          ) : (
            <div className={styles.parentPlaceholder} />
          )}
        </li>
        <li>
          <div className={styles.left}>
            {this.renderElementArray(leftElements)}
          </div>
          <div className={styles.center}>
            {this.renderElement(targetElement, "normal")}
          </div>
          <div className={styles.right}>
            {this.renderElementArray(rightElements)}
          </div>
        </li>
        <li>{this.renderElementArray(childElements)}</li>
      </ul>
    );
  }

  private renderElement(element: ITreeElement, level: RenderingLabelLevel) {
    const tokens = element.label.split("/");

    const label =
      level === "classOnly"
        ? tokens[tokens.length - 1]
        : tokens.length > 3
        ? `${tokens[0]}/${tokens[1]}/... ${tokens[tokens.length - 1]}`
        : element.label;
    const labelFull = element.label;

    return (
      <div className={styles.element}>
        <div
          className={[
            styles.label,
            element.id === this.state.targetId ? styles.targetLabel : undefined
          ].join(" ")}
          onClick={this.onElementClick}
          data-elementid={element.id}
        >
          {label}
        </div>
        <span className={styles.tooltip}>
          {labelFull}
          <br />
          Consume {(element.relativeRatio * 100).toFixed(2)}% (
          {(element.totalRatio * 100).toFixed(2)}% in this range)
        </span>
      </div>
    );
  }

  private renderElementArray(elements: ITreeElement[]) {
    return (
      <ul className={styles.childList}>
        {elements.map(e => (
          <li key={e.id} className={styles.child}>
            {this.renderElement(e, "classOnly")}
          </li>
        ))}
      </ul>
    );
  }

  private onElementClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    const id = parseInt(e.currentTarget.dataset.elementid!, 10);

    if (this.state.targetId !== id) {
      this.setState({ targetId: id! });
      if (this.props.onTargetChanged) {
        this.props.onTargetChanged(id!);
      }
    }
  };
}

export default PerfCallTree;
