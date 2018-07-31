import { h } from "preact";
// tslint:disable:no-implicit-dependencies
import { shallow } from "preact-render-spy";

it("should a", () => {
  const Node = ({ name }) => <div>{name}</div>;
  const context = shallow(<Node name="example" />);
  expect(context.find("div")).toBeTruthy();
});
