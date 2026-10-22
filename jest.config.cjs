module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.{ts,tsx}"],
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }] },
};
