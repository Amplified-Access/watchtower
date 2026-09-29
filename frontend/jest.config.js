const nextJest = require("next/jest.js");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

// groq-js (which runs the Sanity queries against the seed data in tests) and
// its `obug` dependency are published as ES modules only, so they have to go
// through the transform that next/jest otherwise skips for node_modules.
const ESM_PACKAGES = ["groq-js", "obug"];

module.exports = async () => {
  const jestConfig = await createJestConfig(config)();
  const esm = ESM_PACKAGES.join("|");
  return {
    ...jestConfig,
    transformIgnorePatterns: [
      `/node_modules/(?!(\\.pnpm/)?(${esm})[@/])`,
      ...jestConfig.transformIgnorePatterns.filter((pattern) => !pattern.includes("node_modules")),
    ],
  };
};
