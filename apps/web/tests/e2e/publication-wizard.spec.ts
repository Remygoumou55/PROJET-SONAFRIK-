import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { AUTH_STATE_PATH } from "./global-setup";

function hasAuthState(): boolean {
  try {
    return fs.existsSync(AUTH_STATE_PATH);
  } catch {
    return false;
  }
}

test.describe("Publication Wizard", () => {
  test.skip(!hasAuthState(), "Auth state absent — globalSetup requis (compte artiste)");

  test.use({ storageState: AUTH_STATE_PATH });

  test("step 1 — titre et stepper visibles", async ({ page }) => {
    await page.goto("/creator/catalog/tracks/new?step=1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("navigation", { name: "Étapes de publication" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Titre du morceau" })).toBeVisible();
    await expect(page.getByLabel("Titre du morceau")).toBeVisible();
    await expect(page).toHaveURL(/step=1/);
  });

  test("URL ?step=4 sans session — clamp à l'étape 1", async ({ page }) => {
    await page.goto("/creator/catalog/tracks/new?step=4", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Titre du morceau" })).toBeVisible();
    await expect(page).toHaveURL(/step=1/);
  });
});
