import { defineConfig, devices } from "@playwright/test";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Charge .env.local en dev local ; en CI les variables viennent de l'environnement.
const envLocal = resolve(__dirname, ".env.local");
if (existsSync(envLocal)) {
  for (const line of readFileSync(envLocal, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1]!.trim()]) {
      process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
    }
  }
}

/**
 * Config Playwright dédiée à la mesure de performance (B3.2).
 * - testDir séparé (`tests/perf`) : n'interfère pas avec la suite e2e fonctionnelle.
 * - Réutilise le global-setup e2e (provisioning compte artiste + warm route).
 * - Un seul worker, 0 retry : les mesures doivent être déterministes.
 */
export default defineConfig({
  testDir: "./tests/perf",
  // Playwright ne matche que *.spec.ts / *.test.ts par défaut — nos tests perf sont *.perf.ts
  testMatch: "**/*.perf.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "off",
    screenshot: "off",
  },
  projects: [
    {
      name: "perf-chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--autoplay-policy=no-user-gesture-required"],
        },
      },
    },
  ],
  // La pipeline B3.2 démarre elle-même `next start` (serveur production stable).
  webServer: undefined,
});
