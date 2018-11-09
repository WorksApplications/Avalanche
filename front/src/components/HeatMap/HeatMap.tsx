import * as React from "react";
import styles from "./HeatMap.scss";

export interface IProperty {
  maxValue: number;
  values: number[];
  hash: string;
}

export type Data = Pick<IProperty, Exclude<keyof IProperty, "hash">>;

const HeatMap: React.StatelessComponent<IProperty> = () => {
  return <div>Stub</div>;
};
export default HeatMap;
