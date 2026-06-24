import { test, expect } from "@playwright/test";

// Tests publics — aucune authentification requise.
// Vérifient que les pages clés se chargent sans erreur JS et ont le bon titre.

// BYPASS_AUTH=true (défaut .env.local) désactive les redirections middleware.
const bypassAuth = process.env.BYPASS_AUTH === "true";

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
    test.skip(bypassAuth, "BYPASS_AUTH=true — middleware ne redirige pas");

    await page.goto("/listen");

    // Middleware protège /listen — doit rediriger
    await page.waitForURL(/\/auth\/connexion/, { timeout: 10_000 });
    await expect(page.url()).toContain("/auth/connexion");
  });

  test("/wallet sans session — redirige vers /auth/connexion", async ({ page }) => {
    test.skip(bypassAuth, "BYPASS_AUTH=true — middleware ne redirige pas");

    await page.goto("/wallet");

    await page.waitForURL(/\/auth\/connexion/, { timeout: 10_000 });
    await expect(page.url()).toContain("/auth/connexion");
  });

  test("validation formulaire connexion — numéro invalide affiche une erreur", async ({ page }) => {
    await page.goto("/auth/connexion");

    const phoneInput = page.getByLabel(/téléphone/i);
    await phoneInput.fill("+224");
    const submitBtn = page.locator("button[type='submit']").first();
    await submitBtn.click();

    await expect(page.getByText(/Numéro invalide|Format attendu/i)).toBeVisible();
  });

  test("/explorer redirige vers /search", async ({ page }) => {
    await page.goto("/explorer");
    await page.waitForURL(/\/search/, { timeout: 10_000 });
    expect(page.url()).toContain("/search");
  });
});
