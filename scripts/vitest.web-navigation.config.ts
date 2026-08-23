import { defineConfig } from "vitest/config";
import { resolve } from "path";

const root = resolve(__dirname, "..");

/** Tests navigation web — LDSE core + Smart Prefetch Engine (Sprint 2). */
export default defineConfig({
  root,
  resolve: {
    alias: {
      "@": resolve(root, "apps/web/src"),
    },
  },
  test: {
    globals: false,
    environment: "node",
    include: [
      "apps/web/src/features/shared/ldse/**/*.test.ts",
      "apps/web/src/lib/performance/**/*.test.ts",
      "apps/web/src/lib/security/**/*.test.ts",
      "apps/web/src/features/listener/lib/**/*.test.ts",
    ],
  },
});
