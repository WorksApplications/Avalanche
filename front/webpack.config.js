const HtmlPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const DefinePlugin = require("webpack").DefinePlugin;
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
// const OptimizeJsPlugin = require("optimize-js-plugin");

const dest = path.resolve(__dirname, "./public");
const index = path.resolve(__dirname, "./src/index.tsx");

module.exports = env => {
  const isProduction = env && env.production;
  const collectApiBase = env.COLLECT_API_BASE || process.env.COLLECT_API_BASE;
  if (!collectApiBase) {
    console.log(env);
    throw new Error("COLLECT_API_BASE env var is required.");
  }
  return {
    mode: isProduction ? "production" : "development",
    output: {
      filename: "[name].[hash:8].js",
      path: dest
    },
    entry: {
      app: index
    },
    resolve: {
      extensions: [".mjs", ".ts", ".tsx", ".js", ".json", ".jsx"]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader"
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
    plugins: [
      new HtmlPlugin(),
      new MiniCssExtractPlugin({
        filename: "[name].[hash:8].css",
        chunkFilename: "[id].[hash:8].css"
      }),
      new DefinePlugin({
        COLLECT_API_BASE: JSON.stringify(collectApiBase),
        IS_DEBUG: !isProduction,
        APP_NAME: `"Dynamic Analysis"`
      })
      // new OptimizeJsPlugin({
      //   sourceMap: true
      // })
    ],
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          sourceMap: true
        })
      ]
    },
    devtool: isProduction ? "source-map" : "cheap-module-eval-source-map"
  };
};
