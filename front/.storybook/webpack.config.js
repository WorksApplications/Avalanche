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
// you can use this file to add your custom webpack plugins, loaders and anything you like.
// This is just the basic way to add additional webpack configurations.
// For more information refer the docs: https://storybook.js.org/configurations/custom-webpack-config

// IMPORTANT
// When you add this file, we won't add the default configurations which is similar
// to "React Create App". This only has babel loader to load JavaScript.

const webpackConfig = require("../webpack.config")();

module.exports = (baseConfig, env, config) => {
  config.resolve = webpackConfig.resolve;
  config.module.rules =
    env !== "PRODUCTION"
      ? webpackConfig.module.rules
      : webpackConfig.module.rules.map(r =>
          r.test.test(".tsx")
            ? {
                ...r,
                use: [
                  ...r.use,
                  require.resolve("react-docgen-typescript-loader")
                ]
              }
            : r
        );
  return config;
};
