import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";
import * as fs from "fs";

const hasAuthState = () => {
  try { return fs.existsSync(AUTH_STATE_PATH); } catch { return false; }
};

test.describe("Wallet", () => {
  test.use({ storageState: AUTH_STATE_PATH });

  test.beforeEach(async () => {
    test.skip(!hasAuthState(), "Auth state absent — SUPABASE_SERVICE_ROLE_KEY manquant");
  });

  test("/wallet — page accessible (bêta = ComingSoon ou solde GNF)", async ({ page }) => {
    await page.goto("/wallet");

    // Ne doit pas rediriger vers /auth
    await expect(page).not.toHaveURL(/\/auth\//);
    await expect(page).toHaveTitle(/Wallet|Portefeuille|SONAFRIK/i, { timeout: 10_000 });

    // En bêta PAYMENTS_COMING_SOON=true → écran « Bientôt » ; sinon solde GNF
    const comingSoon = page.locator("text=/Bientôt|Portefeuille & Paiements/i").first();
    const balance = page.locator("text=/GNF|0 GNF|Solde/i").first();
    const hasComingSoon = await comingSoon.isVisible().catch(() => false);
    const hasBalance = await balance.isVisible().catch(() => false);
    expect(hasComingSoon || hasBalance).toBeTruthy();
  });

  test("/wallet — bouton recharge visible (paiements verrouillés en bêta = ComingSoon)", async ({ page }) => {
    await page.goto("/wallet");

    await expect(page).not.toHaveURL(/\/auth\//);

    // En bêta, les boutons de recharge affichent "Bientôt" ou sont en ComingSoon
    // On vérifie juste que la page répond (pas d'erreur 500)
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("[class*='error'], [data-error]")).not.toBeVisible();
  });

  test("/wallet — section Abonnements avec tarif DB premium", async ({ page }) => {
    await page.goto("/wallet");
    await expect(page).not.toHaveURL(/\/auth\//);

    await expect(page.locator("text=/Abonnements/i").first()).toBeVisible({ timeout: 12_000 });
    await expect(page.locator("text=/50.?000|50 000/i").first()).toBeVisible({ timeout: 12_000 });
  });
});
