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
          return <EnvironmentCard key={x.id} {...x} />;
        })}
      </div>
    );
  }
}

export default EnvironmentCardList;
