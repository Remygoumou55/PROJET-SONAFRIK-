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

test.describe("Mes publications — bibliothèque artiste", () => {
  test.skip(!hasAuthState(), "Auth state absent — globalSetup requis");

  test.use({ storageState: AUTH_STATE_PATH });

  test("header et CTA unique", async ({ page }) => {
    await page.goto("/creator/catalog/tracks", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Mes publications", level: 1 })).toBeVisible();
    await expect(page.getByText("Gérez vos publications, suivez leur validation")).toBeVisible();
    const publishLinks = page.getByRole("link", { name: /Publier un morceau/i });
    await expect(publishLinks.first()).toBeVisible();
  });
});
