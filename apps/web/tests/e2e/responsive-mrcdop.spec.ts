import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { AUTH_STATE_PATH } from "./global-setup";

const MRCDOP_VIEWPORTS = [
  { width: 320, height: 568, label: "320" },
  { width: 360, height: 640, label: "360" },
  { width: 375, height: 812, label: "375" },
  { width: 390, height: 844, label: "390" },
  { width: 412, height: 915, label: "412" },
  { width: 430, height: 932, label: "430" },
] as const;

function hasAuthState(): boolean {
  try {
    return fs.existsSync(AUTH_STATE_PATH);
  } catch {
    return false;
  }
}

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
    const clientWidth = doc.clientWidth;
    return { scrollWidth, clientWidth };
  });
  expect(
    metrics.scrollWidth,
    `overflow horizontal détecté (${metrics.scrollWidth}px > ${metrics.clientWidth}px)`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function gotoAndSettle(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
}

test.describe("MRCDOP — pages publiques", () => {
  for (const viewport of MRCDOP_VIEWPORTS) {
    test(`landing / @ ${viewport.label}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoAndSettle(page, "/");
      await assertNoHorizontalOverflow(page);
    });

    test(`auth/connexion @ ${viewport.label}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoAndSettle(page, "/auth/connexion");
      await assertNoHorizontalOverflow(page);
    });
  }
});

test.describe("MRCDOP — routes authentifiées", () => {
  test.skip(!hasAuthState(), "Auth state absent — globalSetup requis");

  test.use({ storageState: AUTH_STATE_PATH });

  const authRoutes = ["/listen", "/profile", "/wallet", "/search"] as const;
  const creatorRoutes = ["/creator/catalog/tracks/new"] as const;

  for (const viewport of MRCDOP_VIEWPORTS) {
    for (const route of authRoutes) {
      test(`${route} @ ${viewport.label}px`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await gotoAndSettle(page, route);
        await assertNoHorizontalOverflow(page);
      });
    }

    for (const route of creatorRoutes) {
      test(`${route} @ ${viewport.label}px`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await gotoAndSettle(page, route);
        await assertNoHorizontalOverflow(page);
      });
    }
  }
});

test.describe("MRCDOP — admin connexion", () => {
  for (const viewport of MRCDOP_VIEWPORTS) {
    test(`/admin (redirect) @ ${viewport.label}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoAndSettle(page, "/admin");
      await assertNoHorizontalOverflow(page);
    });
  }
});
