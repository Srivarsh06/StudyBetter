const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: ["lib/**/*.js", "app/api/**/*.js"],
  coveragePathIgnorePatterns: ["/node_modules/", "\\.test\\.js$"],
};

module.exports = createJestConfig(config);
