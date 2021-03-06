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
const HtmlPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const DefinePlugin = require("webpack").DefinePlugin;
const TerserPlugin = require("terser-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
// const PreloadWebpackPlugin = require("preload-webpack-plugin");

const dest = path.resolve(__dirname, "./public");
const index = path.resolve(__dirname, "./src/index.tsx");

module.exports = env => {
  const isProduction = env && env.production;
  const collectApiBase =
    (env && env.COLLECT_API_BASE) || process.env.COLLECT_API_BASE || "/api";
  const blameApiBase =
    (env && env.BLAME_API_BASE) || process.env.BLAME_API_BASE || "/api";
  const flamescopeBase =
    (env && env.FLAMESCOPE_API_BASE) ||
    process.env.FLAMESCOPE_API_BASE ||
    "/api";
  const isAnalyzing = env && env.IS_ANALYZING;
  const option = {
    mode: isProduction ? "production" : "development",
    output: {
      filename: "[name].[hash:8].js",
      path: dest
    },
    entry: {
      app: index
    },
    resolve: {
      extensions: [".mjs", ".ts", ".tsx", ".js", ".json", ".jsx"],
      alias: {
        // We don't use moment API.
        moment: require.resolve("dayjs")
      }
    },
    module: {
      rules: [
        {
          test: /\.[jmt]sx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "babel-loader",
              options: {
                cacheDirectory: true,
                envName: isProduction ? "production" : "development"
              }
            }
          ]
        },
        {
          test: /\.scss$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: {
                sourceMap: true,
                modules: true,
                localIdentName: isProduction
                  ? "[hash:base64:5]"
                  : "[name]__[local]--[hash:base64:5]",
                importLoaders: 1
              }
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: true
              }
            }
          ]
        }
      ]
    },
    // see bottom of this file for conditional plugin usage
    plugins: [
      new HtmlPlugin({
        title: "Avalanche",
        minify: isProduction,
        template: "src/index.html"
      }),
      // new PreloadWebpackPlugin({
      //   rel: "preload",
      //   include: "allAssets",
      //   fileWhitelist: [
      //     /app(\.[0-9a-f]+)?\.(js|css)$/
      //     // /-page(\.[0-9a-f]+)?\.(js|css)$/
      //   ]
      // }),
      new MiniCssExtractPlugin({
        filename: "[name].[hash:8].css"
      }),
      new DefinePlugin({
        COLLECT_API_BASE: JSON.stringify(collectApiBase),
        BLAME_API_BASE: JSON.stringify(blameApiBase),
        FLAMESCOPE_API_BASE: JSON.stringify(flamescopeBase),
        APP_NAME: `"🏔️ Avalanche"`,
        "process.env.NODE_ENV": isProduction
          ? JSON.stringify("production")
          : process.env.NODE_ENV
      }),
      new ForkTsCheckerWebpackPlugin()
    ],
    optimization: {
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: true,
          extractComments: true
        }),
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            map: {
              inline: false
            }
          }
        })
      ]
    },
    devServer: {
      contentBase: dest,
      historyApiFallback: true
    },
    devtool: isProduction ? "source-map" : "cheap-module-eval-source-map"
  };

  if (isAnalyzing) {
    option.plugins.push(
      new (require("webpack-bundle-analyzer")).BundleAnalyzerPlugin()
    );
  }
  if (isProduction && !isAnalyzing) {
    const zopfli = require("@gfx/zopfli");
    option.plugins.push(
      new (require("compression-webpack-plugin"))({
        test: /\.(js|css|html|svg)$/i, // woff2? are already compressed
        cache: true,
        compressionOptions: {
          numiterations: 15
        },
        algorithm(input, compressionOptions, callback) {
          return zopfli.gzip(input, compressionOptions, callback);
        }
      })
    );
  }

  return option;
};
