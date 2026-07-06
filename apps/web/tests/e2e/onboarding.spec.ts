import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";
import * as fs from "fs";

const hasAuthState = () => {
  try {
    return fs.existsSync(AUTH_STATE_PATH);
  } catch {
    return false;
  }
};

test.describe("Onboarding auditeur", () => {
  test.use({ storageState: AUTH_STATE_PATH });

  test.beforeEach(async () => {
    test.skip(!hasAuthState(), "Auth state absent — SUPABASE_SERVICE_ROLE_KEY manquant");
  });

  test("/onboarding/role — page role accessible", async ({ page }) => {
    await page.goto("/onboarding/role");
    await expect(page.locator("body")).toBeVisible();
    const roleChoice = page.locator("text=/auditeur|artiste|listener|artist/i").first();
    await expect(roleChoice).toBeVisible({ timeout: 12_000 });
  });
});
