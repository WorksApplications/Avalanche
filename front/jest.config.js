module.exports = {
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}"],
  transform: {
    "^.+\\.(j|m|t)sx?$": "babel-jest"
  },
  setupTestFrameworkScriptFile: "<rootDir>/setupEnzyme.js",
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
  unmockedModulePathPatterns: ["react", "enzyme", "jest-enzyme"]
};
