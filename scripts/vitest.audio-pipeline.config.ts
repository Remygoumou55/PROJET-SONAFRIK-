import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname, ".."),
  test: {
    globals: false,
    environment: "node",
    include: ["scripts/lib/**/*.test.ts"],
  },
});
