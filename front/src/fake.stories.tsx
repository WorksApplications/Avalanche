// tslint:disable:no-implicit-dependencies
import * as React from "react";

import { action } from "@storybook/addon-actions";
import { linkTo } from "@storybook/addon-links";
import { storiesOf } from "@storybook/react";

storiesOf("Welcome", module).add("to Storybook", () => (
  <div onClick={linkTo("Button")}>To 'Button"</div>
));

storiesOf("Button", module)
  .add("with text", () => <button onClick={action("clicked")}>a</button>)
  .add("with some emoji", () => (
    <button onClick={action("clicked")}>😀 😎 👍 💯</button>
  ));
