import { test, expect } from "@playwright/test";
import {
  authenticateArtist,
  openPublicationsLibrary,
  publicationRowCount,
  waitForPublicationRows,
} from "./publications-e2e-helpers";

test.describe("Mes publications — bibliothèque artiste", () => {
  test.setTimeout(6 * 60 * 1000);

  test("header et CTA unique", async ({ page }) => {
    await authenticateArtist(page);
    await page.goto("/creator/catalog/tracks", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Mes publications", level: 1 })).toBeVisible();
    await expect(
      page.getByText("Gérez votre catalogue musical et suivez chaque publication."),
    ).toBeVisible();
    const publishLinks = page.getByRole("link", { name: /Nouvelle publication/i });
    await expect(publishLinks).toHaveCount(1);
    await expect(publishLinks.first()).toBeVisible();
  });

  test("chargement initial et filtres alignés sur les URLs directes", async ({ page }) => {
    await authenticateArtist(page);

    await openPublicationsLibrary(page);
    expect(await publicationRowCount(page)).toBeGreaterThan(0);

    const checks = [
      { label: "Tous", query: "" },
      { label: "Publiés", query: "?status=published" },
      { label: "En revue", query: "?status=pending_review" },
      { label: "Brouillons", query: "?status=draft" },
      { label: "Refusés", query: "?status=rejected" },
      { label: "Archivés", query: "?status=archived" },
      { label: "Validation", query: "?status=validation" },
      { label: "Planifiés", query: "?status=scheduled" },
    ] as const;

    const expectedCounts = new Map<string, number>();
    for (const check of checks) {
      await page.goto(`/creator/catalog/tracks${check.query}`, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      if (check.query) {
        await waitForPublicationRows(page, 8000).catch(() => undefined);
      } else {
        await waitForPublicationRows(page);
      }
      expectedCounts.set(check.label, await publicationRowCount(page));
    }

    for (const check of checks) {
      await openPublicationsLibrary(page);
      const matchesTargetUrl = (): boolean => {
        const url = new URL(page.url());
        if (check.query) {
          return (
            url.pathname === "/creator/catalog/tracks" &&
            `?${url.searchParams.toString()}` === check.query
          );
        }
        return url.pathname === "/creator/catalog/tracks" && !url.searchParams.has("status");
      };
      // Re-clic tolérant à la course d'hydratation React : après un remount frais,
      // le handler client (router.push) peut ne pas être attaché au 1er clic.
      for (let attempt = 0; attempt < 4 && !matchesTargetUrl(); attempt += 1) {
        await page.getByRole("button", { name: check.label }).click();
        await page.waitForURL(() => matchesTargetUrl(), { timeout: 15000 }).catch(() => undefined);
      }
      await page.waitForURL(() => matchesTargetUrl(), { timeout: 120000 });
      const expectedCount = expectedCounts.get(check.label) ?? 0;
      if (expectedCount > 0) {
        await waitForPublicationRows(page, 8000);
      } else {
        await page.waitForTimeout(1800);
      }
      expect(await publicationRowCount(page), `filter ${check.label} should match direct URL`).toBe(
        expectedCount,
      );
    }
  });

  test("actualiser reste borné et conserve la liste", async ({ page }) => {
    await authenticateArtist(page);
    let requestCount = 0;
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("supabase.co") || url.includes("/rest/v1/") || url.includes("/functions/v1/")) {
        requestCount += 1;
      }
    });

    await openPublicationsLibrary(page);
    const beforeCount = requestCount;
    await page.getByRole("button", { name: "Actualiser" }).click();
    await page.waitForTimeout(2500);
    const refreshRequests = requestCount - beforeCount;

    expect(refreshRequests).toBeLessThan(100);
    expect(await publicationRowCount(page)).toBeGreaterThan(0);
  });
});
