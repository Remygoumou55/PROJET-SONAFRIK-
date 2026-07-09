import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH, CERTIFIED_TRACK_ID } from "./global-setup";
import * as fs from "fs";

const hasAuthState = () => {
  try {
    return fs.existsSync(AUTH_STATE_PATH);
  } catch {
    return false;
  }
};

test.describe("Pages listener étendues", () => {
  test.use({ storageState: AUTH_STATE_PATH });

  test.beforeEach(async () => {
    test.skip(!hasAuthState(), "Auth state absent — SUPABASE_SERVICE_ROLE_KEY manquant");
  });

  test("/listen?track= — deep link affiche accueil sans erreur auth", async ({ page }) => {
    await page.goto(`/listen?track=${CERTIFIED_TRACK_ID}`);
    await expect(page).not.toHaveURL(/\/auth\//, { timeout: 12_000 });
    await expect(page.locator("body")).toBeVisible();
    const status = page.locator("text=/Lancement de la lecture|Impossible|disponible/i").first();
    await expect(status).toBeVisible({ timeout: 15_000 });
  });

  test("/listen/track/[id] — redirect vers accueil avec param track", async ({ page }) => {
    await page.goto(`/listen/track/${CERTIFIED_TRACK_ID}`);
    await expect(page).toHaveURL(new RegExp(`/listen\\?track=${CERTIFIED_TRACK_ID}`), {
      timeout: 12_000,
    });
  });

  test("/listen — RecommendedSection se rend ou est silencieusement absente (pas d'erreur)", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/listen");
    await expect(page.locator("body")).toBeVisible({ timeout: 12_000 });

    // Attendre que le skeleton de la section (ou le contenu) se resolve côté client
    // On attend max 8s que le skeleton disparaisse ou que la section apparaisse
    const section = page.getByRole("region", { name: "Recommandé pour vous" });
    const skeleton = page.locator('[class*="reco"]').first();

    // La section est soit visible (tracks disponibles) soit absente (0 tracks = return null)
    // Les deux cas sont valides — on vérifie juste qu'il n'y a pas d'erreur JS fatale
    await page.waitForTimeout(5_000);

    const sectionVisible = await section.isVisible().catch(() => false);
    if (sectionVisible) {
      // Si la section est présente, vérifier qu'elle contient au moins un lien de track
      const trackLinks = section.locator('a[href^="/listen/track/"]');
      await expect(trackLinks.first()).toBeVisible({ timeout: 5_000 });
    }

    // Filtrer les erreurs réseau attendues (auth, etc.) — seules les erreurs React/JS comptent
    const fatalErrors = consoleErrors.filter(
      (e) => e.includes("TypeError") || e.includes("ReferenceError") || e.includes("Cannot read"),
    );
    expect(fatalErrors).toHaveLength(0);
  });
});
