import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";
import * as fs from "fs";

// Tests authentifiés — nécessitent NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Sans ces variables, le globalSetup n'a pas pu créer le storageState et les tests sont ignorés.

const hasAuthState = () => {
  try { return fs.existsSync(AUTH_STATE_PATH); } catch { return false; }
};

test.describe("Utilisateur authentifié", () => {
  test.use({ storageState: AUTH_STATE_PATH });

  test.beforeEach(async () => {
    test.skip(!hasAuthState(), "Auth state absent — SUPABASE_SERVICE_ROLE_KEY manquant");
  });

  test("/listen — page d'accueil accessible et affiche une salutation", async ({ page }) => {
    await page.goto("/listen");

    // Ne doit pas rediriger vers /auth
    await expect(page).not.toHaveURL(/\/auth\//);

    // Doit avoir le titre SONAFRIK
    await expect(page).toHaveTitle(/SONAFRIK/i, { timeout: 10_000 });

    // Une salutation temporelle doit être visible (Bonjour / Bon après-midi / Bonsoir)
    const greeting = page.locator("text=/Bonjour|Bon après-midi|Bonsoir/i").first();
    await expect(greeting).toBeVisible({ timeout: 10_000 });
  });

  test("/search — page de recherche accessible", async ({ page }) => {
    await page.goto("/search");

    await expect(page).not.toHaveURL(/\/auth\//);
    await expect(page).toHaveTitle(/Recherche|SONAFRIK/i, { timeout: 10_000 });

    // Un champ de recherche doit être présent
    const searchInput = page.locator(
      "input[type='search'], input[placeholder*='Chercher'], input[placeholder*='Rechercher'], input[placeholder*='Artiste']",
    ).first();
    await expect(searchInput).toBeVisible({ timeout: 8_000 });
  });

  test("/listen → navigation vers /search fonctionne", async ({ page }) => {
    await page.goto("/listen");

    // Trouver le lien de recherche dans la navigation
    const searchLink = page.locator("a[href='/search']").first();
    await expect(searchLink).toBeVisible({ timeout: 8_000 });
    await searchLink.click();

    await page.waitForURL(/\/search/, { timeout: 8_000 });
    await expect(page.url()).toContain("/search");
  });
});
