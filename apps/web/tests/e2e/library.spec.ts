import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";
import * as fs from "fs";

const hasAuthState = () => {
  try { return fs.existsSync(AUTH_STATE_PATH); } catch { return false; }
};

test.describe("Bibliothèque auditeur", () => {
  test.use({ storageState: AUTH_STATE_PATH });

  test.beforeEach(async () => {
    test.skip(!hasAuthState(), "Auth state absent — SUPABASE_SERVICE_ROLE_KEY manquant");
  });

  test("/library — page accessible sans redirect auth", async ({ page }) => {
    await page.goto("/library");
    await expect(page).not.toHaveURL(/\/auth\//, { timeout: 12_000 });
    await expect(page).toHaveTitle(/Bibliothèque|Library|SONAFRIK/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("/library — section favoris ou playlists visible", async ({ page }) => {
    await page.goto("/library");
    await expect(page).not.toHaveURL(/\/auth\//);

    const section = page.locator(
      "text=/Favoris|Playlists|Bibliothèque|Aucun|playlist/i",
    ).first();
    await expect(section).toBeVisible({ timeout: 12_000 });
  });
});
