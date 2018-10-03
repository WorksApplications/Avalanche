// tslint:disable-next-line:no-implicit-dependencies
import { shallow } from "enzyme";
import * as React from "react";

it("should a", () => {
  const Node = ({ name }: { name: string }) => <div>{name}</div>;
  const context = shallow(<Node name="example" />);
  expect(context.find("div")).toBeTruthy();
});
