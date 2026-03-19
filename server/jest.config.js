require("dotenv").config();

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testPathIgnorePatterns: ["/node_modules/", "/__tests__/setup/"],
  moduleNameMapper: {
    "^shared/(.*)$": "<rootDir>/../shared/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup/setupAfterEnv.ts"],
};
