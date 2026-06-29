import { defineConfig } from "vitest/config";
import { resolve } from "path";

const root = resolve(__dirname, "..");

export default defineConfig({
  root,
  test: {
    globals: false,
    environment: "node",
    include: ["apps/web/src/features/shared/ldse/**/*.test.ts"],
  },
});
