/**
 * B1 — Pagination UI certifiée (catalogue multi-pages).
 * Requiert `PUBLICATIONS_E2E_PAGE_SIZE` (ex. 10) + serveur Next démarré avec la même variable.
 */
import { test, expect } from "@playwright/test";
import {
  authenticateArtist,
  exercisePaginationUi,
  openPublicationsLibrary,
  PUBLICATIONS_PAGE_SIZE,
  publicationRowCount,
  waitForPublicationRows,
} from "./publications-e2e-helpers";
import { PUBLICATIONS_PAGE_SIZE_PRODUCTION } from "../../src/features/creator/publications/lib/publicationsPageSize";

test.describe("Mes publications — Pagination UI (B1)", () => {
  test.setTimeout(10 * 60 * 1000);

  test.beforeAll(() => {
    test.skip(
      PUBLICATIONS_PAGE_SIZE >= PUBLICATIONS_PAGE_SIZE_PRODUCTION,
      "Définir PUBLICATIONS_E2E_PAGE_SIZE<50 et redémarrer le serveur Next",
    );
  });

  test("Suivant / Précédent avec métadonnées de page", async ({ page }) => {
    await authenticateArtist(page);
    await openPublicationsLibrary(page);

    const rows = await publicationRowCount(page);
    expect(rows).toBe(PUBLICATIONS_PAGE_SIZE);

    await exercisePaginationUi(page);
  });

  test("navigation directe page=3 puis retour page=1", async ({ page }) => {
    await authenticateArtist(page);
    await page.goto("/creator/catalog/tracks?page=3", {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    await expect(page.getByRole("heading", { name: "Mes publications" })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole("navigation", { name: "Pagination du catalogue" })).toBeVisible({
      timeout: 60_000,
    });
    await waitForPublicationRows(page);
    expect(await publicationRowCount(page)).toBeGreaterThan(0);

    await page.getByRole("link", { name: /Précédent/i }).click();
    await page.waitForURL(/[?&]page=2\b/, { timeout: 120_000 });
    await waitForPublicationRows(page);
    expect(await publicationRowCount(page)).toBe(PUBLICATIONS_PAGE_SIZE);
  });
});
