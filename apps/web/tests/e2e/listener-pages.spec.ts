import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH, CERTIFIED_TRACK_ID } from "./global-setup";
import * as fs from "fs";

const hasAuthState = () => {
  try {
    return fs.existsSync(AUTH_STATE_PATH);
  } catch {
    return false;
  }
};

test.describe("Pages listener étendues", () => {
  test.use({ storageState: AUTH_STATE_PATH });

  test.beforeEach(async () => {
    test.skip(!hasAuthState(), "Auth state absent — SUPABASE_SERVICE_ROLE_KEY manquant");
  });

  test("/listen?track= — deep link affiche accueil sans erreur auth", async ({ page }) => {
    await page.goto(`/listen?track=${CERTIFIED_TRACK_ID}`);
    await expect(page).not.toHaveURL(/\/auth\//, { timeout: 12_000 });
    await expect(page.locator("body")).toBeVisible();
    const status = page.locator("text=/Lancement de la lecture|Impossible|introuvable/i").first();
    await expect(status).toBeVisible({ timeout: 15_000 });
  });

  test("/listen/track/[id] — redirect vers accueil avec param track", async ({ page }) => {
    await page.goto(`/listen/track/${CERTIFIED_TRACK_ID}`);
    await expect(page).toHaveURL(new RegExp(`/listen\\?track=${CERTIFIED_TRACK_ID}`), {
      timeout: 12_000,
    });
  });
});
