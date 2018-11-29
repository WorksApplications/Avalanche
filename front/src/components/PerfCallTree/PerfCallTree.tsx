import * as React from "react";
import styles from "./PerfCallTree.scss";

export interface ITreeElement {
  parentId?: number;
  childIds: number[];
  label: string;
  totalRatio: number;
  immediateRatio: number;
  id: number;
}

export interface IProperty {
  treeMap: ITreeElement[];
  targetId?: number;

  onTargetChanged?(targetId: number): void;
}

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
    let elementToShowAsRoot =
      this.state.targetId !== null && this.props.treeMap[this.state.targetId];
    if (
      elementToShowAsRoot &&
      typeof elementToShowAsRoot.parentId !== "undefined"
    ) {
      elementToShowAsRoot = this.props.treeMap[elementToShowAsRoot.parentId];
    }

    return (
      <div className={styles.wrap}>
        {elementToShowAsRoot && this.renderTreeElement(elementToShowAsRoot, 3)}
      </div>
    );
  }

  private renderTreeElement(element: ITreeElement, remainsDepth: number) {
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
          {element.label}
        </div>
        <ul className={styles.childList}>
          {remainsDepth > 1 &&
            element.childIds.map(c => {
              const ce = this.props.treeMap[c];
              return (
                ce &&
                element.totalRatio * 0.1 < ce.totalRatio && ( // only shows 10%
                  <li className={styles.child} key={ce.id}>
                    {this.renderTreeElement(ce, remainsDepth - 1)}
                  </li>
                )
              );
            })}
        </ul>
      </div>
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
