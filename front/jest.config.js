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
    APP_NAME: "[Avalanche]"
  }
};
