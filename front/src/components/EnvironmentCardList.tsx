import { Component, h } from "preact";
import EnvironmentCard, {
  IProperty as IEnvironmentCardProperty
} from "./EnvironmentCard";
// @ts-ignore
import styles from "./EnvironmentCardList.scss";

export interface IProperty {
  data: Array<IEnvironmentCardProperty & { id: string }>;
}

class EnvironmentCardList extends Component<IProperty, {}> {
  public render() {
    return (
      <div className={styles.wrap}>
        {this.props.data.map(x => {
          return (
            <div key={x.id} className={styles.card}>
              <EnvironmentCard {...x} />
            </div>
          );
        })}
      </div>
    );
  }
}

export default EnvironmentCardList;
