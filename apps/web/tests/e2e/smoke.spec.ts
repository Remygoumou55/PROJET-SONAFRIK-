import { test, expect } from "@playwright/test";

// Tests publics — aucune authentification requise.
// Vérifient que les pages clés se chargent sans erreur JS.

const bypassAuth = process.env.BYPASS_AUTH === "true";

async function expectAuthEntryPoint(page: import("@playwright/test").Page) {
  await expect(page).toHaveTitle(/Connexion|SONAFRIK/i);
  const googleBtn = page.getByRole("button", { name: /Continuer avec Google/i });
  const phoneInput = page.getByLabel(/téléphone/i);
  const hasGoogle = await googleBtn.isVisible().catch(() => false);
  const hasPhone = await phoneInput.isVisible().catch(() => false);
  expect(hasGoogle || hasPhone).toBe(true);
}

test.describe("Pages publiques", () => {
  test("page auth/connexion — se charge (Google ou SMS selon feature flag)", async ({ page }) => {
    await page.goto("/auth/connexion");
    await expectAuthEntryPoint(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 8_000 });
  });

  test("/auth/inscription redirige vers /auth/connexion", async ({ page }) => {
    await page.goto("/auth/inscription");
    await page.waitForURL(/\/auth\/connexion/, { timeout: 10_000 });
    await expectAuthEntryPoint(page);
  });

  test("/listen sans session — redirige vers /auth/connexion", async ({ page }) => {
    test.skip(bypassAuth, "BYPASS_AUTH=true — middleware ne redirige pas");

    await page.goto("/listen");
    await page.waitForURL(/\/auth\/connexion/, { timeout: 10_000 });
    expect(page.url()).toContain("/auth/connexion");
  });

  test("/wallet sans session — redirige vers /auth/connexion", async ({ page }) => {
    test.skip(bypassAuth, "BYPASS_AUTH=true — middleware ne redirige pas");

    await page.goto("/wallet");
    await page.waitForURL(/\/auth\/connexion/, { timeout: 10_000 });
    expect(page.url()).toContain("/auth/connexion");
  });

  test("validation formulaire connexion — numéro invalide affiche une erreur (SMS uniquement)", async ({
    page,
  }) => {
    await page.goto("/auth/connexion");

    const phoneInput = page.getByLabel(/téléphone/i);
    const phoneVisible = await phoneInput.isVisible().catch(() => false);
    test.skip(!phoneVisible, "auth_phone_enabled=false — flux Google uniquement");

    await phoneInput.fill("+224");
    const submitBtn = page.locator("button[type='submit']").first();
    await submitBtn.click();

    await expect(page.getByText(/Numéro invalide|Format attendu/i)).toBeVisible();
  });

  test("page aide connexion — /auth/mot-de-passe-oublie", async ({ page }) => {
    await page.goto("/auth/mot-de-passe-oublie");
    await expect(page).toHaveTitle(/Besoin d'aide|SONAFRIK/i);
    await expect(page.getByRole("heading", { level: 1, name: /Besoin d'aide/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Retour à la connexion/i })).toBeVisible();
  });

  test("/explorer redirige vers /search", async ({ page }) => {
    await page.goto("/explorer");
    await page.waitForURL(/\/search/, { timeout: 10_000 });
    expect(page.url()).toContain("/search");
  });
});
