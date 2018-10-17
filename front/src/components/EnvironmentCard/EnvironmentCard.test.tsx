// tslint:disable-next-line:no-implicit-dependencies
import { shallow } from "enzyme";
import * as React from "react";
import EnvironmentCard, {
  IProperty as EnvironmentCardProperty
} from "./EnvironmentCard";

const sel = (strings: TemplateStringsArray) => {
  if (strings.length === 1) {
    return `[data-test="${strings[0]}"]`;
  }
  throw new Error("Invalid argument");
};

const basicCardProps: EnvironmentCardProperty = {
  name: "jillk",
  version: "18.03-",
  kind: "observed",
  onEdit: () => ({})
};

describe("<EnvironmentCard />", () => {
  it("renders itself", () => {
    const context = shallow(<EnvironmentCard {...basicCardProps} />);
    expect(context.find(sel`root`).exists()).toBe(true);
  });

  it("renders with 'unconfigured' style when it is unconfigured", () => {
    const context = shallow(
      <EnvironmentCard {...basicCardProps} kind="unconfigured" />
    );
    expect(context.find(sel`root`).hasClass("unconfigured")).toBe(true);
  });

  it("renders with 'configured' style when it is configured", () => {
    const context = shallow(
      <EnvironmentCard {...basicCardProps} kind="configured" />
    );
    expect(context.find(sel`root`).hasClass("configured")).toBe(true);
  });

  it("renders with 'observed' style when it is observed", () => {
    const context = shallow(
      <EnvironmentCard {...basicCardProps} kind="observed" />
    );
    expect(context.find(sel`root`).hasClass("observed")).toBe(true);
  });

  it("'s edit button is click-able", () => {
    const mockHandler = jest.fn();
    const context = shallow(
      <EnvironmentCard {...basicCardProps} onEdit={mockHandler} />
    );
    expect(context.find(sel`edit-button`).simulate("click"));
    expect(mockHandler).toBeCalled();
  });
});
