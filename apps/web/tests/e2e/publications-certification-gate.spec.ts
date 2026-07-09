/**
 * PHASE 3 — Certification Gate Mes publications
 * Multi-viewports + historique navigateur + pagination URL-driven.
 * Même project chromium ; viewports via context device (CI stable).
 */
import { test, expect, devices, type Browser } from "@playwright/test";
import {
  authenticateArtist,
  clickStatusFilter,
  exercisePaginationUi,
  expectStableShell,
  openPublicationsLibrary,
  PUBLICATIONS_PAGE_SIZE,
  publicationRowCount,
  waitForPublicationRows,
} from "./publications-e2e-helpers";

test.describe("Mes publications — Certification Gate (Phase 3)", () => {
  test.setTimeout(8 * 60 * 1000);

  test("desktop — historique back/forward après filtres", async ({ page }) => {
    await authenticateArtist(page);
    await openPublicationsLibrary(page);
    const allCount = await publicationRowCount(page);
    expect(allCount).toBeGreaterThan(0);

    await clickStatusFilter(page, "Publiés", "?status=published");
    await waitForPublicationRows(page, 8000).catch(() => undefined);
    const publishedCount = await publicationRowCount(page);
    expect(page.url()).toContain("status=published");

    await clickStatusFilter(page, "Brouillons", "?status=draft");
    await waitForPublicationRows(page, 8000).catch(() => undefined);
    expect(page.url()).toContain("status=draft");
    const draftCount = await publicationRowCount(page);

    await page.goBack();
    await page.waitForURL(/status=published/, { timeout: 120_000 });
    if (publishedCount > 0) await waitForPublicationRows(page, 8000);
    else await page.waitForTimeout(1500);
    expect(await publicationRowCount(page)).toBe(publishedCount);

    await page.goForward();
    await page.waitForURL(/status=draft/, { timeout: 120_000 });
    if (draftCount > 0) await waitForPublicationRows(page, 8000);
    else await page.waitForTimeout(1500);
    expect(await publicationRowCount(page)).toBe(draftCount);

    await page.goBack();
    await page.goBack();
    await page.waitForURL((url) => {
      return url.pathname === "/creator/catalog/tracks" && !url.searchParams.has("status");
    }, { timeout: 120_000 });
    await waitForPublicationRows(page);
    expect(await publicationRowCount(page)).toBe(allCount);
  });

  test("desktop — pagination UI Suivant/Précédent", async ({ page }) => {
    const { PUBLICATIONS_PAGE_SIZE_PRODUCTION } = await import(
      "../../src/features/creator/publications/lib/publicationsPageSize"
    );
    test.skip(
      PUBLICATIONS_PAGE_SIZE >= PUBLICATIONS_PAGE_SIZE_PRODUCTION,
      "PUBLICATIONS_E2E_PAGE_SIZE requis — voir publications-pagination-ui.spec.ts",
    );

    await authenticateArtist(page);
    await openPublicationsLibrary(page);
    await exercisePaginationUi(page);
  });

  test("desktop — tri met à jour l'URL et conserve une liste stable", async ({ page }) => {
    await authenticateArtist(page);
    await openPublicationsLibrary(page);
    const before = await publicationRowCount(page);

    await page.getByLabel("Trier le catalogue").selectOption({ label: "Ordre alphabétique" });
    await page.waitForURL(/sort=alpha/, { timeout: 120_000 });
    await waitForPublicationRows(page);
    expect(await publicationRowCount(page)).toBe(before);

    await page.getByLabel("Trier le catalogue").selectOption({ label: "Plus récent" });
    await page.waitForURL((url) => {
      return url.pathname === "/creator/catalog/tracks" && !url.searchParams.has("sort");
    }, { timeout: 120_000 });
    await waitForPublicationRows(page);
    expect(await publicationRowCount(page)).toBe(before);
  });

  for (const viewport of [
    { name: "tablet", device: devices["iPad (gen 7)"] },
    { name: "mobile", device: devices["iPhone 13"] },
  ] as const) {
    test(`${viewport.name} — shell + liste + filtre Publiés`, async ({ browser }) => {
      await runViewportSmoke(browser, viewport.name, viewport.device);
    });
  }
});

async function runViewportSmoke(
  browser: Browser,
  name: string,
  device: (typeof devices)[keyof typeof devices],
): Promise<void> {
  const context = await browser.newContext({ ...device });
  const page = await context.newPage();
  try {
    await authenticateArtist(page);
    await openPublicationsLibrary(page);
    await expectStableShell(page);
    const allCount = await publicationRowCount(page);
    expect(allCount, `${name} should render publications`).toBeGreaterThan(0);

    await clickStatusFilter(page, "Publiés", "?status=published");
    await waitForPublicationRows(page, 8000).catch(() => undefined);
    expect(page.url()).toContain("status=published");
    const publishedCount = await publicationRowCount(page);
    expect(publishedCount).toBeLessThanOrEqual(allCount);
  } finally {
    await context.close();
  }
}
