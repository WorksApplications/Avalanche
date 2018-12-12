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
module.exports = {
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}"],
  transform: {
    ".+\\.(j|m|t)sx?$": "babel-jest",
    ".+\\.(css|styl|less|sass|scss)$":
      "<rootDir>/node_modules/jest-css-modules-transform"
  },
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.(t|j)s?(x)",
    "<rootDir>/src/**/?(*.)(spec|test).(t|j)s?(x)"
  ],
  moduleFileExtensions: [
    "mjs",
    "web.ts",
    "ts",
    "web.tsx",
    "tsx",
    "web.js",
    "js",
    "web.jsx",
    "jsx",
    "json",
    "node"
  ],
  unmockedModulePathPatterns: ["react"],
  globals: {
    COLLECT_API_BASE: "[collect]",
    FLAMESCOPE_API_BASE: "[flamescope]",
    BLAME_API_BASE: "[blame]",
    APP_NAME: "[Avalanche]"
  }
};
