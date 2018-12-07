/*
 * Copyright (c) 2017 Works Applications Co., Ltd.
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

import { storiesOf } from "@storybook/react";
import Spinner from "./Spinner";

const commonWrapStyle: React.CSSProperties = {
  width: "20px",
  padding: "8px",
  backgroundColor: "#e3e6e8"
};

storiesOf("Spinner", module)
  .add("Small", () => (
    <div style={commonWrapStyle}>
      <Spinner />
    </div>
  ))
  .add("Bigger", () => (
    <div style={{ ...commonWrapStyle, width: "60px" }}>
      <Spinner />
    </div>
  ));
