import { addDecorator, configure } from "@storybook/react";
import { withInfo } from "@storybook/addon-info";

// automatically import all files ending in *.stories.js
const req = require.context("../src", true, /\.stories\.[jt]sx?$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

addDecorator(withInfo());

configure(loadStories, module);
