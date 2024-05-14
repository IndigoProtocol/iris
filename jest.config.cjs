module.exports = {
  rootDir: ".",
  preset: 'ts-jest',
  // preset: 'ts-jest/presets/default-esm',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
  ],
  transform: {
    "^.+\\.ts?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
    // "^.+\\.ts?$": "babel-jest",
  },
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>'],
  moduleDirectories: ["node_modules", "<rootDir>"],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  setupFiles: [
    '<rootDir>/tests/setup.ts',
  ],
};
