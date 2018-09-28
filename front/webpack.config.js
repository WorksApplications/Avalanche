const HtmlPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const DefinePlugin = require("webpack").DefinePlugin;
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const dest = path.resolve(__dirname, "./public");
const index = path.resolve(__dirname, "./src/index.tsx");

const history = require("connect-history-api-fallback");
const convert = require("koa-connect");

module.exports = env => {
  const isProduction = env && env.production;
  const apiBaseUrl = env.API_BASE_URL || process.env.API_BASE_URL;
  const appName = "Dynamic Analysis";
  if (!apiBaseUrl) {
    console.log(env);
    throw new Error("API_BASE_URL env var is required.");
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
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: [
            // {
            //   loader: "babel-loader",
            //   options: {
            //     cacheDirectory: true,
            //     babelrc: false,
            //     presets: [
            //       [
            //         "@babel/preset-env",
            //         { targets: { browsers: "last 2 versions" } }
            //       ],
            //       "@babel/preset-typescript"
            //     ],
            //     plugins: [
            //       ["@babel/plugin-proposal-decorators", { legacy: true }],
            //       ["@babel/plugin-proposal-class-properties", { loose: true }],
            //
            //       // These should be babel-preset-preact...
            //       ["@babel/plugin-transform-react-jsx", { pragma: "h" }],
            //       "@babel/plugin-syntax-jsx"
            //     ]
            //   }
            // },
            {
              loader: "ts-loader",
              options: {
                transpileOnly: true
              }
            },
            {
              loader: "ifdef-loader",
              options: {
                DEBUG: !isProduction
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
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: {
                localIdentName: isProduction
                  ? "[hash:base64:5]"
                  : "[name]__[local]--[hash:base64:5]"
              }
            }
          ]
        },
        {
          // WAP fonts
          test: /\.(woff(2)?|ttf|eot|svg)(\?[a-z1-9]+)?$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].[hash:base64:5].[ext]",
                outputPath: "fonts/"
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new HtmlPlugin({
        title: appName,
        minify: isProduction,
        template: "src/index.html"
      }),
      new MiniCssExtractPlugin({
        filename: "[name].[hash:8].css",
        chunkFilename: "[id].[hash:8].css"
      }),
      new DefinePlugin({
        COLLECT_API_BASE: JSON.stringify(apiBaseUrl),
        IS_DEBUG: !isProduction,
        APP_NAME: `"${appName}"`
      }),
      new ForkTsCheckerWebpackPlugin()
    ],
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: true
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
    devtool: isProduction ? "source-map" : "cheap-module-eval-source-map",
    serve: {
      add: app => {
        const historyOptions = {
          index: "/index.html"
        };

        app.use(convert(history(historyOptions)));
      }
    }
  };
};
