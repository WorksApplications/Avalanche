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
// tslint:disable:no-submodule-imports no-implicit-dependencies
import "jest-dom/extend-expect";
import * as React from "react";
import { fireEvent, render } from "react-testing-library";
import "react-testing-library/cleanup-after-each";
import {
  EnvironmentCard,
  IProperty as EnvironmentCardProperty
} from "./EnvironmentCard";

const basicCardProps: EnvironmentCardProperty = {
  name: "jillk",
  version: "18.03-",
  kind: "observed"
};

describe("<EnvironmentCard />", () => {
  it("renders itself", () => {
    const { getByTestId } = render(<EnvironmentCard {...basicCardProps} />);
    expect(getByTestId("root")).not.toBeNull();
  });

  it("renders with 'unconfigured' style when it is unconfigured", () => {
    const { getByTestId } = render(
      <EnvironmentCard {...basicCardProps} kind="unconfigured" />
    );
    expect(getByTestId("root")).toHaveClass("unconfigured");
  });

  it("renders with 'configured' style when it is configured", () => {
    const { getByTestId } = render(
      <EnvironmentCard {...basicCardProps} kind="configured" />
    );
    expect(getByTestId("root")).toHaveClass("configured");
  });

  it("renders with 'observed' style when it is observed", () => {
    const { getByTestId } = render(
      <EnvironmentCard {...basicCardProps} kind="observed" />
    );
    expect(getByTestId("root")).toHaveClass("observed");
  });

  it("'s edit button is click-able", () => {
    const mockHandler = jest.fn();
    const { getByTestId } = render(
      <EnvironmentCard {...basicCardProps} onEdit={mockHandler} />
    );
    fireEvent.click(getByTestId("edit-button"));
    expect(mockHandler).toBeCalled();
  });
});
