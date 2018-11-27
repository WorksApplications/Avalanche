import * as React from "react";
import styles from "./PerfCallTree.scss";

export interface ITreeElement {
  parentId?: string;
  childIds: string[];
  label: string;
  id: string;
}

export interface IProperty {
  treeMap: Map<string, ITreeElement>;
  targetId?: string;

  onTargetChanged(targetId: string): void;
}

const initialState = { targetId: null as string | null };
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
      this.state.targetId && this.props.treeMap.get(this.state.targetId);
    if (
      elementToShowAsRoot &&
      typeof elementToShowAsRoot.parentId !== "undefined"
    ) {
      elementToShowAsRoot = this.props.treeMap.get(
        elementToShowAsRoot.parentId
      );
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
          className={styles.label}
          onClick={this.onElementClick}
          data-elementid={element.id}
        >
          {element.label}
          {element.id === this.state.targetId && "!"}
        </div>
        <ul className={styles.childList}>
          {remainsDepth > 1 &&
            element.childIds.map(c => {
              const ce = this.props.treeMap.get(c);
              return (
                ce && (
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

    const id = e.currentTarget.dataset.elementid;

    if (this.state.targetId !== id) {
      this.setState({ targetId: id! });
      this.props.onTargetChanged(id!);
    }
  };
}

export default PerfCallTree;
