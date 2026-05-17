/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { useESM: true, tsconfig: "tsconfig.test.json" }],
  },
  testMatch: ["**/test/integration/**/*.test.ts"],
  setupFiles: ["<rootDir>/test/integration/env.ts"],
  testTimeout: 30000,
}
