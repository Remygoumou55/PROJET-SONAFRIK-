import { test, expect } from "@playwright/test";

test.describe("Admin — accès public", () => {
  test("non-admin redirigé depuis /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/(auth\/connexion|listen)/, { timeout: 15_000 });
  });

  test("/admin/audit — non-admin ne voit pas le journal", async ({ page }) => {
    await page.goto("/admin/audit");
    await expect(page).not.toHaveURL(/\/admin\/audit$/, { timeout: 15_000 });
  });
});
