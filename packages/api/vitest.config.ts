import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: [
      "src/metadata/**/*.test.ts",
      "src/publication/**/*.test.ts",
      "src/streaming/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      include: [
        "src/publication/**/*.ts",
        "src/streaming/application/**/*.ts",
        "src/streaming/runtime/**/*.ts",
        "src/streaming/integration/**/*.ts",
        "src/streaming/events/**/*.ts",
        "src/streaming/ports/**/*.ts",
        "src/streaming/contracts/**/*.ts",
        "src/streaming/session/**/*.ts",
        "src/streaming/playback/**/*.ts",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/metadata/**/index.ts",
        "src/publication/**/index.ts",
        "src/metadata/application/commands/**",
        "src/metadata/application/queries/**",
        "src/metadata/application/dto/**",
        "src/publication/dto/**",
        "src/publication/workflow/**",
        "src/streaming/application/commands/**",
        "src/streaming/application/queries/**",
        "src/streaming/application/dto/**",
        "src/streaming/session/session.commands.ts",
        "src/streaming/session/supabase-session.repository.ts",
        "src/streaming/playback/playback.commands.ts",
        "src/streaming/**/index.ts",
        "src/streaming/contracts/**",
        "src/streaming/ports/streaming-runtime.ports.ts",
        "src/streaming/application/ports/streaming-application.ports.ts",
      ],
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 90,
        lines: 95,
        "src/streaming/**": {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
      },
    },
  },
});
