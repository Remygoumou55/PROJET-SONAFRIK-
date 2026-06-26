import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";
import * as fs from "fs";

const hasAuthState = () => {
  try { return fs.existsSync(AUTH_STATE_PATH); } catch { return false; }
};

/**
 * Chaîne MVP auditeur authentifié — écoute → recherche → portefeuille.
 * Valide que les routes protégées restent accessibles avec session valide.
 */
test.describe("MVP chain (authenticated)", () => {
  test.use({ storageState: AUTH_STATE_PATH });

  test.beforeEach(async () => {
    test.skip(!hasAuthState(), "Auth state absent — SUPABASE_SERVICE_ROLE_KEY manquant");
  });

  test("listen → search → wallet sans redirection auth", async ({ page }) => {
    await page.goto("/listen");
    await expect(page).not.toHaveURL(/\/auth\//, { timeout: 12_000 });
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/search");
    await expect(page).not.toHaveURL(/\/auth\//, { timeout: 12_000 });
    await expect(page).toHaveTitle(/Recherche|Search|SONAFRIK/i);

    await page.goto("/wallet");
    await expect(page).not.toHaveURL(/\/auth\//, { timeout: 12_000 });
    await expect(page).toHaveTitle(/Portefeuille|Wallet|SONAFRIK/i);
  });

  test("/wallet — section abonnements ou solde visible", async ({ page }) => {
    await page.goto("/wallet");
    await expect(page).not.toHaveURL(/\/auth\//);

    const premiumOrBalance = page.locator(
      "text=/Premium|Essai gratuit|Solde|GNF|Abonnement/i",
    ).first();
    await expect(premiumOrBalance).toBeVisible({ timeout: 12_000 });
  });

  test("/wallet — tarifs abonnement depuis DB (premium mensuel)", async ({ page }) => {
    await page.goto("/wallet");
    await expect(page).not.toHaveURL(/\/auth\//);

    const plansSection = page.locator("text=/Abonnements/i").first();
    await expect(plansSection).toBeVisible({ timeout: 12_000 });

    // 50 000 GNF = plan premium mensuel en DB (subscription_plans)
    const monthlyPrice = page.locator("text=/50.?000|50 000/i").first();
    await expect(monthlyPrice).toBeVisible({ timeout: 12_000 });
  });

  test("/wallet/royalties — Revenue Pool artistes visible", async ({ page }) => {
    await page.goto("/wallet/royalties");
    await expect(page).not.toHaveURL(/\/auth\//);
    await expect(page).toHaveTitle(/Royalties|SONAFRIK/i);

    await expect(page.locator("text=/Revenue Pool/i").first()).toBeVisible({ timeout: 12_000 });
    await expect(page.locator("text=/65%|65 %/i").first()).toBeVisible({ timeout: 12_000 });
  });

  test("/wallet/payout — page retrait accessible (flag OFF = message staging)", async ({ page }) => {
    await page.goto("/wallet/payout");
    await expect(page).not.toHaveURL(/\/auth\//);
    await expect(page).toHaveTitle(/Retrait|SONAFRIK/i);

    const payoutUi = page.locator(
      "text=/Orange Money|compte de retrait|NEXT_PUBLIC_PAYMENTS_ENABLED|Retrait/i",
    ).first();
    await expect(payoutUi).toBeVisible({ timeout: 12_000 });
  });
});
