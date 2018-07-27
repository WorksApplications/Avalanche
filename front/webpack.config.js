const HtmlPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

const dest = path.resolve(__dirname, "./public");
const index = path.resolve(__dirname, "./src/index.tsx");

module.exports = env => {
  const isProduction = env && env.production;
  return {
    mode: isProduction ? "production" : "development",
    output: {
      filename: "[name].js",
      path: dest
    },
    entry: {
      app: index
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
        filename: "[name].css",
        chunkFilename: "[id].css"
      })
    ],
    devtool: isProduction ? "cheap-module-eval-source-map" : "source-map"
  };
};
