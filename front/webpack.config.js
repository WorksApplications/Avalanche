const HtmlPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const DefinePlugin = require("webpack").DefinePlugin;
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const PreloadWebpackPlugin = require("preload-webpack-plugin");

const dest = path.resolve(__dirname, "./public");
const index = path.resolve(__dirname, "./src/index.tsx");

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
          test: /\.[jmt]sx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "babel-loader",
              options: {
                cacheDirectory: true
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
      // new require("webpack-bundle-analyzer").BundleAnalyzerPlugin()
      new HtmlPlugin({
        title: appName,
        minify: isProduction,
        template: "src/index.html"
      }),
      new PreloadWebpackPlugin({
        rel: "preload",
        include: "allAssets",
        fileWhitelist: [
          /app(\.[0-9a-f]+)?\.(js|css)$/,
          /-page(\.[0-9a-f]+)?\.(js|css)$/
        ] // in the future, other chunks will be added with lower priority...
      }),
      new MiniCssExtractPlugin({
        filename: "[name].[hash:8].css"
      }),
      new DefinePlugin({
        COLLECT_API_BASE: JSON.stringify(apiBaseUrl),
        IS_DEBUG: !isProduction,
        APP_NAME: `"${appName}"`,
        "process.env.NODE_ENV": isProduction
          ? JSON.stringify("production")
          : process.env.NODE_ENV
      }),
      new ForkTsCheckerWebpackPlugin()
    ],
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: true,
          uglifyOptions: {
            output: {
              comments: false
            }
          }
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
};
