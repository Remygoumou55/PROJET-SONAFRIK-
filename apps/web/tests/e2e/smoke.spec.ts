import { test, expect } from "@playwright/test";

// Tests publics — aucune authentification requise.
// Vérifient que les pages clés se chargent sans erreur JS et ont le bon titre.

test.describe("Pages publiques", () => {
  test("page auth/connexion — se charge et affiche le formulaire téléphone", async ({ page }) => {
    await page.goto("/auth/connexion");

    await expect(page).toHaveTitle(/Connexion/i);
    // Le champ téléphone doit être présent
    const phoneInput = page.locator("input[type='tel'], input[placeholder*='téléphone'], input[placeholder*='phone']").first();
    await expect(phoneInput).toBeVisible({ timeout: 8_000 });
  });

  test("page auth/inscription — se charge et affiche le formulaire téléphone", async ({ page }) => {
    await page.goto("/auth/inscription");

    await expect(page).toHaveTitle(/Inscription/i);
    const phoneInput = page.locator("input[type='tel'], input[placeholder*='téléphone'], input[placeholder*='phone']").first();
    await expect(phoneInput).toBeVisible({ timeout: 8_000 });
  });

  test("/listen sans session — redirige vers /auth/connexion", async ({ page }) => {
    await page.goto("/listen");

    // Middleware protège /listen — doit rediriger
    await page.waitForURL(/\/auth\/connexion/, { timeout: 10_000 });
    await expect(page.url()).toContain("/auth/connexion");
  });

  test("/wallet sans session — redirige vers /auth/connexion", async ({ page }) => {
    await page.goto("/wallet");

    await page.waitForURL(/\/auth\/connexion/, { timeout: 10_000 });
    await expect(page.url()).toContain("/auth/connexion");
  });

  test("validation formulaire connexion — numéro vide affiche une erreur", async ({ page }) => {
    await page.goto("/auth/connexion");

    // Soumettre sans remplir le champ
    const submitBtn = page.locator("button[type='submit']").first();
    await submitBtn.click();

    // Un message d'erreur ou le bouton reste désactivé
    const hasError = await page.locator("[role='alert'], .text-red, [class*='error'], [class*='erreur']").isVisible().catch(() => false);
    const btnDisabled = await submitBtn.isDisabled().catch(() => false);
    expect(hasError || btnDisabled).toBeTruthy();
  });
});
