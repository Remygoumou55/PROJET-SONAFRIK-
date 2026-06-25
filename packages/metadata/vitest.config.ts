import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/isrc/**/*.ts"],
      exclude: [
        "src/isrc/**/*.test.ts",
        "src/isrc/index.ts",
        "src/isrc/repositories/ISRCRepository.ts",
      ],
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
    },
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
});
