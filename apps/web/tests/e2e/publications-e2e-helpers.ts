import { expect, test, type Page } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { resolvePublicationsPageSize } from "../../src/features/creator/publications/lib/publicationsPageSize";

export const PUBLICATIONS_TEST_EMAIL =
  process.env.PLAYWRIGHT_TEST_EMAIL ?? "s13b-playwright-listener@sonafrik.test";
export const PUBLICATIONS_TEST_PASSWORD =
  process.env.PLAYWRIGHT_TEST_PASSWORD ?? "S13BCert2026!";
export const PUBLICATIONS_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/** PAGE_SIZE effectif (50 prod, ou `PUBLICATIONS_E2E_PAGE_SIZE` en certification). */
export const PUBLICATIONS_PAGE_SIZE = resolvePublicationsPageSize();

export async function authenticateArtist(page: Page): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const baseHost = new URL(PUBLICATIONS_BASE_URL).hostname;
  const authCookies: { name: string; value: string }[] = [];
  const client = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return authCookies;
      },
      setAll(cookiesToSet: { name: string; value: string }[]) {
        for (const { name, value } of cookiesToSet) {
          const idx = authCookies.findIndex((cookie) => cookie.name === name);
          if (!value) {
            if (idx >= 0) authCookies.splice(idx, 1);
          } else if (idx >= 0) {
            authCookies[idx] = { name, value };
          } else {
            authCookies.push({ name, value });
          }
        }
      },
    },
  });
  const { error } = await client.auth.signInWithPassword({
    email: PUBLICATIONS_TEST_EMAIL,
    password: PUBLICATIONS_TEST_PASSWORD,
  });
  test.skip(!!error || authCookies.length === 0, "Compte artiste de test indisponible");
  await page.context().addCookies(
    authCookies.map(({ name, value }) => ({
      name,
      value,
      domain: baseHost,
      path: "/",
      httpOnly: false,
      secure: PUBLICATIONS_BASE_URL.startsWith("https"),
      sameSite: "Lax" as const,
    })),
  );
}

export async function publicationRowCount(page: Page): Promise<number> {
  return page.locator(".pub-catalog__list article").count();
}

async function waitForLoadingSettled(page: Page, timeoutMs = 180_000): Promise<void> {
  const loading = page.locator(".pub-library__loading");
  const started = Date.now();
  if ((await loading.count()) === 0) return;
  await expect(loading).toBeHidden({ timeout: Math.max(1_000, timeoutMs - (Date.now() - started)) });
}

/**
 * Attend la liste peuplée OU un empty state réel (post-loading).
 * Ne traite jamais "Chargement…" comme une bibliothèque vide.
 */
export async function waitForPublicationLibrarySettled(
  page: Page,
  timeoutMs = 180_000,
): Promise<"rows" | "empty"> {
  await waitForLoadingSettled(page, timeoutMs);
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const rows = await publicationRowCount(page);
    if (rows > 0) return "rows";
    if ((await page.locator(".pub-library__loading").count()) > 0) {
      await waitForLoadingSettled(page, Math.max(5_000, deadline - Date.now()));
      continue;
    }
    const emptyVisible = await page
      .getByText(/Aucune publication|catalogue est vide|Première publication/i)
      .first()
      .isVisible()
      .catch(() => false);
    if (emptyVisible) return "empty";
    if (await page.getByRole("button", { name: /Actualiser|Actualisation/i }).isVisible().catch(() => false)) {
      // Controls visibles = état prêt (liste ou filtres sans match)
      const stillRows = await publicationRowCount(page);
      return stillRows > 0 ? "rows" : "empty";
    }
    await page.waitForTimeout(400);
  }
  const finalRows = await publicationRowCount(page);
  return finalRows > 0 ? "rows" : "empty";
}

export async function waitForPublicationRows(page: Page, timeoutMs = 180_000): Promise<void> {
  const state = await waitForPublicationLibrarySettled(page, timeoutMs);
  if (state === "rows") return;
  // Dernière chance : rows peuvent arriver juste après empty false-positive
  const deadline = Date.now() + Math.min(20_000, timeoutMs);
  while (Date.now() < deadline) {
    if ((await publicationRowCount(page)) > 0) return;
    await page.waitForTimeout(400);
  }
}

export async function openPublicationsLibrary(page: Page): Promise<void> {
  await page.goto("/creator/catalog/tracks", {
    waitUntil: "domcontentloaded",
    timeout: 180_000,
  });
  await expect(page.getByRole("heading", { name: "Mes publications" })).toBeVisible({
    timeout: 60_000,
  });
  const state = await waitForPublicationLibrarySettled(page, 180_000);
  expect(state, "Mes publications doit peupler le catalogue artiste de test").toBe("rows");
  await expect(page.locator(".pub-catalog__list article").first()).toBeVisible({ timeout: 10_000 });
}

export async function clickStatusFilter(page: Page, label: string, query: string): Promise<void> {
  await page.getByRole("button", { name: label, exact: true }).click();
  if (query) {
    await page.waitForURL(`**/creator/catalog/tracks${query}`, { timeout: 120_000 });
  } else {
    await page.waitForURL((url) => {
      return (
        url.pathname === "/creator/catalog/tracks" &&
        !url.searchParams.has("status")
      );
    }, { timeout: 120_000 });
  }
  await waitForLoadingSettled(page, 120_000);
}

export async function expectStableShell(page: Page): Promise<void> {
  await waitForLoadingSettled(page, 180_000);
  await expect(page.getByRole("heading", { name: "Mes publications", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Nouvelle publication/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Actualiser|Actualisation/i })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByLabel("Rechercher dans le catalogue")).toBeVisible();
  await expect(page.getByLabel("Trier le catalogue")).toBeVisible();
}

/** B1 — Exercice pagination UI Suivant/Précédent (catalogue multi-pages requis). */
export async function exercisePaginationUi(page: Page): Promise<void> {
  const pagination = page.getByRole("navigation", { name: "Pagination du catalogue" });
  await expect(pagination).toBeVisible({ timeout: 30_000 });

  const page1Count = await publicationRowCount(page);
  expect(page1Count).toBeGreaterThan(0);
  expect(page1Count).toBeLessThanOrEqual(PUBLICATIONS_PAGE_SIZE);

  const meta = pagination.locator(".pub-library__pagination-meta");
  await expect(meta).toContainText(new RegExp(`1–${page1Count}`));

  const next = page.getByRole("link", { name: /Suivant/i });
  await expect(next).toBeVisible();
  await next.click();
  await page.waitForURL(/[?&]page=2\b/, { timeout: 120_000 });
  await waitForPublicationRows(page);

  const page2Count = await publicationRowCount(page);
  expect(page2Count).toBeGreaterThan(0);
  expect(page2Count).toBeLessThanOrEqual(PUBLICATIONS_PAGE_SIZE);

  const prev = page.getByRole("link", { name: /Précédent/i });
  await expect(prev).toBeVisible();
  await prev.click();
  await page.waitForURL((url) => {
    return url.pathname === "/creator/catalog/tracks" && !url.searchParams.has("page");
  }, { timeout: 120_000 });
  await waitForPublicationRows(page);
  expect(await publicationRowCount(page)).toBe(page1Count);
}
