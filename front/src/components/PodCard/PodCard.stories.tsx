/*
 * Copyright (c) 2018 Works Applications Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// tslint:disable:no-implicit-dependencies no-submodule-imports
import * as React from "react";

import { action } from "@storybook/addon-actions";
import { boolean, withKnobs } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react";
import * as ReactTooltip from "react-tooltip";
import "../../App.scss";
import PodCard from "./PodCard";

const commonWrapStyle: React.CSSProperties = {
  display: "flex",
  width: "400px",
  padding: "8px",
  backgroundColor: "#e3e6e8",
  justifyContent: "center",
  alignContent: "center"
};

storiesOf("PodCard", module)
  .addDecorator(withKnobs)
  .add("No snapshots", () => (
    <div style={commonWrapStyle}>
      <PodCard
        isAlive={boolean("Is alive", true)}
        isSaving={boolean("Is saving", false)}
        app="scm"
        environment="jillk"
        name="scm-costallocation-5d4556db46-jzqp2"
        createdAt={new Date()}
        snapshots={[]}
        onSaveButtonClick={
          boolean("Can take snaphost", true) ? action("Saved!") : undefined
        }
      />
      <ReactTooltip effect="solid" place="top" aria-haspopup="true" />
    </div>
  ))
  .add("1 snapshot", () => (
    <div style={commonWrapStyle}>
      <PodCard
        isAlive={boolean("Is alive", true)}
        isSaving={boolean("Is saving", false)}
        app="scm"
        environment="jillk"
        name="scm-costallocation-5d4556db46-jzqp2"
        createdAt={new Date()}
        snapshots={[
          {
            uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            link:
              "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90"
          }
        ]}
        onSaveButtonClick={
          boolean("Can take snaphost", true) ? action("Saved!") : undefined
        }
      />
      <ReactTooltip effect="solid" place="top" aria-haspopup="true" />
    </div>
  ))
  .add("3 snapshots", () => (
    <div style={commonWrapStyle}>
      <PodCard
        isAlive={boolean("Is alive", true)}
        isSaving={boolean("Is saving", false)}
        app="scm"
        environment="jillk"
        name="scm-costallocation-5d4556db46-jzqp2"
        createdAt={new Date()}
        snapshots={[
          {
            uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            link:
              "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90"
          },
          {
            uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            link:
              "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90"
          },
          {
            uuid: "d7eec7c1-daf5-4198-9503-6957aea0bf90",
            createdAt: new Date(),
            link:
              "http://flamescope.internal.worksap.com/#/heatmap/collabo-bd6dc859c-f7dfm%2Fa0%2Fd7eec7c1-daf5-4198-9503-6957aea0bf90"
          }
        ]}
        onSaveButtonClick={
          boolean("Can take snaphost", true) ? action("Saved!") : undefined
        }
      />
      <ReactTooltip effect="solid" place="top" aria-haspopup="true" />
    </div>
  ));
