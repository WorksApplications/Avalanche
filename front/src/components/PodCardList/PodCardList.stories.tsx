// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { action } from "@storybook/addon-actions";
import { text, withKnobs } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";
import PodCardList from "./PodCardList";

const commonWrapStyle: React.CSSProperties = {
  width: "400px",
  padding: "8px",
  backgroundColor: "#e3e6e8"
};

storiesOf("PodCardList", module)
  .addDecorator(withKnobs)
  .add("No pods", () => (
    <div style={commonWrapStyle}>
      <PodCardList
        data={[]}
        kind={text("Kind", "all")}
        noDataMessage={text("No data message", "No pods")}
      />
    </div>
  ))
  .add("1 pod", () => (
    <div style={commonWrapStyle}>
      <PodCardList
        data={[
          {
            id: "1",
            isAlive: true,
            app: "ess",
            environment: "jillk",
            name: "ess-765c6ccfcd-9hrsv",
            createdAt: new Date(),
            snapshots: [
              {
                uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
                createdAt: new Date(),
                link:
                  "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90"
              }
            ],
            onSaveButtonClick: action("Saved 1")
          }
        ]}
        kind={text("Kind", "all")}
      />
    </div>
  ))
  .add("3 pods", () => (
    <div style={commonWrapStyle}>
      <PodCardList
        data={[1, 2, 3].map(i => ({
          id: i.toString(),
          isAlive: true,
          app: "ess",
          environment: "jillk",
          name: "ess-765c6ccfcd-9hrsv",
          createdAt: new Date(),
          snapshots: [
            {
              uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
              createdAt: new Date(),
              link:
                "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90"
            }
          ],
          onSaveButtonClick: action(`Saved ${i}`)
        }))}
        kind={text("Kind", "all")}
      />
    </div>
  ));
