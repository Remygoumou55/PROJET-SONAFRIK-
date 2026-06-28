import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";
import * as fs from "fs";

const hasAuthState = () => {
  try { return fs.existsSync(AUTH_STATE_PATH); } catch { return false; }
};

/**
 * Chaîne finance auditeur — wallet → royalties → payout.
 * Complète mvp-chain.spec.ts (Phase D).
 */
test.describe("Finance chain (authenticated)", () => {
  test.use({ storageState: AUTH_STATE_PATH });

  test.beforeEach(async () => {
    test.skip(!hasAuthState(), "Auth state absent — SUPABASE_SERVICE_ROLE_KEY manquant");
  });

  test("wallet → royalties → payout — navigation sans auth redirect", async ({ page }) => {
    for (const path of ["/wallet", "/wallet/royalties", "/wallet/payout"] as const) {
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/auth\//, { timeout: 12_000 });
    }
  });

  test("/wallet — plans premium DB (mensuel + annuel)", async ({ page }) => {
    await page.goto("/wallet");
    await expect(page.locator("text=/Abonnements/i").first()).toBeVisible({ timeout: 12_000 });
    await expect(page.locator("text=/50.?000|50 000/i").first()).toBeVisible({ timeout: 12_000 });
    await expect(page.locator("text=/480.?000|480 000/i").first()).toBeVisible({ timeout: 12_000 });
  });

  test("/wallet/royalties — pool 65% et historique", async ({ page }) => {
    await page.goto("/wallet/royalties");
    await expect(page.locator("text=/Revenue Pool/i").first()).toBeVisible({ timeout: 12_000 });
    await expect(page.locator("text=/65%|65 %/i").first()).toBeVisible({ timeout: 12_000 });
  });

  test("/wallet/payout — UI retrait ou message staging", async ({ page }) => {
    await page.goto("/wallet/payout");
    const payoutUi = page.locator(
      "text=/Orange Money|compte de retrait|Retrait|staging/i",
    ).first();
    await expect(payoutUi).toBeVisible({ timeout: 12_000 });
  });
});
