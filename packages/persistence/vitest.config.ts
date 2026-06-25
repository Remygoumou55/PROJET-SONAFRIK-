import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/adapters/**/*.ts",
        "src/core/**/*.ts",
        "src/di/**/*.ts",
        "src/errors/**/*.ts",
        "src/factory/**/*.ts",
        "src/observability/**/*.ts",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/index.ts",
        "src/adapters/memory/helpers*.ts",
        "src/core/persistence-store.ts",
        "src/adapters/memory/in-memory-stubs.repository.ts",
      ],
      thresholds: {
        statements: 68,
        branches: 68,
        functions: 62,
        lines: 68,
      },
    },
  },
});
