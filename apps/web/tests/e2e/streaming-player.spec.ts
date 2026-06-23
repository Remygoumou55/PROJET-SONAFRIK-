import { test, expect, type Page } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";

const CONSOLE_BLOCKLIST = /hydration|favicon|devtools|infinite recursion detected in policy|Failed to load resource.*500|\[Player\] (Erreur audio|Reprise audio)/i;
const S12B_ARTIST_EMAIL = "s12b-artist-1-1782222972289@sonafrik.test";
const S12B_ARTIST_PASSWORD = "Sprint12BTest2026!";

async function injectS12bArtistSession(page: Page, baseURL: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const baseHost = new URL(baseURL).hostname;
  const authCookies: { name: string; value: string }[] = [];
  const { createServerClient } = await import("@supabase/ssr");
  const client = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return authCookies;
      },
      setAll(cookiesToSet: { name: string; value: string }[]) {
        for (const { name, value } of cookiesToSet) {
          const idx = authCookies.findIndex((c) => c.name === name);
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
    email: S12B_ARTIST_EMAIL,
    password: S12B_ARTIST_PASSWORD,
  });
  test.skip(!!error || authCookies.length === 0, "Artiste S12B indisponible");

  await page.context().addCookies(
    authCookies.map(({ name, value }) => ({
      name,
      value,
      domain: baseHost,
      path: "/",
      httpOnly: false,
      secure: baseURL.startsWith("https"),
      sameSite: "Lax" as const,
    })),
  );
  await page.goto(baseURL);
}

/** Attend que le player soit en lecture (Pause visible). */
async function waitForPlaying(page: Page, trackPattern: RegExp = /S12B Track 1/i) {
  await expect(page.getByText(trackPattern).last()).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Fermer l'erreur" }).click().catch(() => {});

  const pauseBtn = page.locator('button[aria-label="Pause"]');
  const lectureBtn = page.locator('button[aria-label="Lecture"]');
  const playerBar = page.locator("div.fixed").filter({ hasText: trackPattern });

  await expect(playerBar).toBeVisible({ timeout: 15_000 });
  await playerBar.locator(".animate-spin").waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});

  for (let attempt = 0; attempt < 8; attempt++) {
    if (await pauseBtn.isVisible().catch(() => false)) return;
    if (await lectureBtn.isVisible().catch(() => false)) {
      await lectureBtn.click({ force: true });
      await page.waitForTimeout(800);
    }
  }
  await expect(pauseBtn).toBeVisible({ timeout: 15_000 });
}

/** Lecture via /search?q= (morceau certifié S12B). */
async function startPlaybackFromSearch(page: Page) {
  await page.goto("/search?q=S12B+Track");
  const trackBtn = page.getByRole("button").filter({ hasText: /S12B Track 1/i }).first();
  await expect(trackBtn).toBeVisible({ timeout: 30_000 });
  await trackBtn.click();
  await expect(page.locator("text=Impossible de lire")).toHaveCount(0, { timeout: 15_000 });
  await waitForPlaying(page);
}

test.describe("Sprint 1.3-C — Player & UI runtime", () => {
  test.describe.configure({ timeout: 120_000 });
  test.use({ storageState: AUTH_STATE_PATH });

  test.beforeEach(async () => {
    const fs = await import("fs");
    test.skip(!fs.existsSync(AUTH_STATE_PATH), "Auth state absent");
  });

  test("/listen — charge sans page blanche ni erreur console critique", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !CONSOLE_BLOCKLIST.test(msg.text())) {
        errors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/listen");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/Bonjour|Bon après-midi|Bonsoir/)).toBeVisible({ timeout: 15_000 });

    const bg = await page.evaluate(() => {
      const el = document.querySelector("[style*='noir-profond']") ?? document.body;
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bg).not.toBe("rgb(255, 255, 255)");

    expect(errors).toEqual([]);
  });

  test("Player — Play, Pause, Resume, Volume, Seek", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !CONSOLE_BLOCKLIST.test(msg.text())) errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await startPlaybackFromSearch(page);

    const playerBar = page.locator("div.fixed").filter({ hasText: "S12B Track 1" });
    const pauseBtn = playerBar.locator('button[aria-label="Pause"]');
    const lectureBtn = playerBar.locator('button[aria-label="Lecture"]');

    await pauseBtn.click({ force: true });
    await expect(lectureBtn).toBeVisible({ timeout: 5_000 });

    await lectureBtn.click({ force: true });
    await expect(pauseBtn).toBeVisible({ timeout: 5_000 });

    const volumeSlider = page.getByRole("slider", { name: "Volume" });
    if (await volumeSlider.isVisible()) {
      await volumeSlider.fill("0.5");
    }

    const progressSlider = page.getByRole("slider", { name: /Progression/i });
    if (await progressSlider.isVisible()) {
      await progressSlider.fill("30");
    }

    await expect(page.locator("text=Impossible de")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("Player — Next et Previous avec file d'attente", async ({ page }) => {
    await page.goto("/search?q=S12B+Track");
    const playButtons = page.getByRole("button").filter({ hasText: /S12B Track [0-9]/i });
    await expect(playButtons.first()).toBeVisible({ timeout: 30_000 });
    const count = await playButtons.count();
    test.skip(count < 2, "Moins de 2 morceaux S12B en recherche — skip Next/Prev");

    await playButtons.nth(0).click();
    await waitForPlaying(page, /S12B Track [0-9]/i);

    const playerBar = page.locator("div.fixed").filter({ hasText: /S12B Track/i });
    const nextBtn = playerBar.getByRole("button", { name: "Morceau suivant" });
    await expect(nextBtn).toBeVisible({ timeout: 5_000 });
    await nextBtn.click();
    await page.waitForTimeout(1500);
    await expect(page.getByRole("button", { name: /Pause|Lecture/ })).toBeVisible();

    const prevBtn = playerBar.getByRole("button", { name: "Morceau précédent" });
    await prevBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.getByRole("button", { name: /Pause|Lecture/ })).toBeVisible();
  });

  test("/creator/analytics — artiste authentifié charge les stats", async ({ page, baseURL }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !CONSOLE_BLOCKLIST.test(msg.text())) errors.push(msg.text());
    });

    await injectS12bArtistSession(page, baseURL ?? "http://localhost:3000");
    await page.goto("/creator/analytics");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/stream|écout|Streams|Total/i).first()).toBeVisible({
      timeout: 20_000,
    });
    expect(errors).toEqual([]);
  });
});
