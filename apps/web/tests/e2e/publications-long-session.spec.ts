/**
 * B2 — Long Session Stress
 * - quick (défaut) : 20 cycles (~8–12 min)
 * - long : `PLAYWRIGHT_STRESS_DURATION_MS=1800000` (30 min)
 */
import { test, expect } from "@playwright/test";
import {
  authenticateArtist,
  clickStatusFilter,
  openPublicationsLibrary,
  publicationRowCount,
  waitForPublicationLibrarySettled,
} from "./publications-e2e-helpers";

const STRESS_CYCLES = Number.parseInt(process.env.PLAYWRIGHT_STRESS_CYCLES ?? "20", 10);
const STRESS_DURATION_MS = Number.parseInt(process.env.PLAYWRIGHT_STRESS_DURATION_MS ?? "0", 10);
const IS_LONG_MODE = STRESS_DURATION_MS > 0;

async function ensureCatalogControls(page: import("@playwright/test").Page): Promise<void> {
  const sort = page.getByLabel("Trier le catalogue");
  if (await sort.isVisible().catch(() => false)) return;
  await clickStatusFilter(page, "Tous", "");
  await waitForPublicationLibrarySettled(page, 60_000);
  await expect(sort).toBeVisible({ timeout: 30_000 });
}

test.describe("Mes publications — Long Session Stress (B2)", () => {
  test.setTimeout(IS_LONG_MODE ? 35 * 60 * 1000 : 25 * 60 * 1000);

  test(
    IS_LONG_MODE
      ? `session continue ${Math.round(STRESS_DURATION_MS / 60_000)} min`
      : `${STRESS_CYCLES} cycles filtres + tri + refresh + navigation`,
    async ({ page }) => {
      await authenticateArtist(page);
      await openPublicationsLibrary(page);

      let requestCount = 0;
      page.on("request", (request) => {
        const url = request.url();
        if (url.includes("supabase.co") || url.includes("/rest/v1/")) {
          requestCount += 1;
        }
      });

      const baselineCount = await publicationRowCount(page);
      expect(baselineCount).toBeGreaterThan(0);

      const filters = [
        { label: "Publiés", query: "?status=published" },
        { label: "Brouillons", query: "?status=draft" },
        { label: "En revue", query: "?status=pending_review" },
        { label: "Tous", query: "" },
      ] as const;

      const startedAt = Date.now();
      let cycle = 0;

      const shouldContinue = (): boolean => {
        if (IS_LONG_MODE) return Date.now() - startedAt < STRESS_DURATION_MS;
        return cycle < STRESS_CYCLES;
      };

      while (shouldContinue()) {
        const filter = filters[cycle % filters.length]!;
        await clickStatusFilter(page, filter.label, filter.query);
        await waitForPublicationLibrarySettled(page, 60_000);

        if (cycle % 3 === 0) {
          await ensureCatalogControls(page);
          await page.getByLabel("Trier le catalogue").selectOption({ label: "Ordre alphabétique" });
          await page.waitForURL(/sort=alpha/, { timeout: 60_000 });
          await waitForPublicationLibrarySettled(page, 60_000);
          await page.getByLabel("Trier le catalogue").selectOption({ label: "Plus récent" });
          await page.waitForURL((url) => !url.searchParams.has("sort"), { timeout: 60_000 });
          await waitForPublicationLibrarySettled(page, 60_000);
        }

        if (cycle % 5 === 0) {
          await ensureCatalogControls(page);
          await page.getByRole("button", { name: /Actualiser|Actualisation/i }).click();
          await page.waitForTimeout(2000);
        }

        if (cycle % 7 === 0) {
          await page.goBack().catch(() => undefined);
          await page.waitForTimeout(500);
          await page.goForward().catch(() => undefined);
          await waitForPublicationLibrarySettled(page, 60_000);
        }

        cycle += 1;
      }

      const elapsedMin = Math.round((Date.now() - startedAt) / 60_000);
      test.info().annotations.push({
        type: "stress-metrics",
        description: `cycles=${cycle} elapsedMin=${elapsedMin} requests=${requestCount}`,
      });

      await clickStatusFilter(page, "Tous", "");
      await waitForPublicationLibrarySettled(page, 60_000);
      expect(await publicationRowCount(page)).toBe(baselineCount);

      const requestBudget = IS_LONG_MODE ? cycle * 150 + 2000 : cycle * 120;
      expect(requestCount, `stress requests=${requestCount} cycles=${cycle}`).toBeLessThan(
        requestBudget,
      );
    },
  );
});
