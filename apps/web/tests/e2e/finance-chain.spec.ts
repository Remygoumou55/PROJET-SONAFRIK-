import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";
import * as fs from "fs";

const hasAuthState = () => {
  try { return fs.existsSync(AUTH_STATE_PATH); } catch { return false; }
};

/**
 * Chaîne finance auditeur — wallet → royalties → payout.
 * Complète mvp-chain.spec.ts (Phase D).
 */
test.describe("Finance chain (authenticated)", () => {
  test.use({ storageState: AUTH_STATE_PATH });

  test.beforeEach(async () => {
    test.skip(!hasAuthState(), "Auth state absent — SUPABASE_SERVICE_ROLE_KEY manquant");
  });

  test("wallet → royalties → payout — navigation sans auth redirect", async ({ page }) => {
    for (const path of ["/wallet", "/wallet/royalties", "/wallet/payout"] as const) {
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/auth\//, { timeout: 12_000 });
    }
  });

  test("/wallet — plans premium DB (mensuel + annuel)", async ({ page }) => {
    await page.goto("/wallet");
    await expect(page.locator("text=/Abonnements/i").first()).toBeVisible({ timeout: 12_000 });
    await expect(page.locator("text=/50.?000|50 000/i").first()).toBeVisible({ timeout: 12_000 });
    await expect(page.locator("text=/480.?000|480 000/i").first()).toBeVisible({ timeout: 12_000 });
  });

  test("/wallet/royalties — pool 65% et historique", async ({ page }) => {
    await page.goto("/wallet/royalties");
    await expect(page.locator("text=/Revenue Pool/i").first()).toBeVisible({ timeout: 12_000 });
    await expect(page.locator("text=/65%|65 %/i").first()).toBeVisible({ timeout: 12_000 });
  });

  test("/wallet/payout — UI retrait ou message staging", async ({ page }) => {
    await page.goto("/wallet/payout");
    const payoutUi = page.locator(
      "text=/Orange Money|compte de retrait|Retrait|staging/i",
    ).first();
    await expect(payoutUi).toBeVisible({ timeout: 12_000 });
  });

  test("/wallet — solde ou historique visible", async ({ page }) => {
    await page.goto("/wallet");
    await expect(
      page.locator("text=/Solde|Historique|GNF|Portefeuille/i").first(),
    ).toBeVisible({ timeout: 12_000 });
  });

  test("sandbox payment-initiate — refus opérateur prod sans credentials", async ({ request }) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    test.skip(!supabaseUrl || !anonKey, "Supabase env manquant");

    const authRes = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: { apikey: anonKey!, "Content-Type": "application/json" },
      data: {
        email: "s13b-playwright-listener@sonafrik.test",
        password: "S13BCert2026!",
      },
    });
    test.skip(!authRes.ok(), "Compte certification indisponible");
    const authBody = (await authRes.json()) as { access_token?: string };
    test.skip(!authBody.access_token, "JWT certification absent");

    const res = await request.post(`${supabaseUrl}/functions/v1/payment-initiate`, {
      headers: {
        Authorization: `Bearer ${authBody.access_token}`,
        apikey: anonKey!,
        "Content-Type": "application/json",
      },
      data: {
        provider: "orange_money_gn",
        purpose: "topup",
        amountGnf: 5000,
        phone: "620000000",
      },
    });

    const body = (await res.json()) as { sandbox?: boolean; error?: string };
    expect([200, 503]).toContain(res.status());
    if (res.status() === 503) {
      expect(body.error).toBe("payment_operator_not_ready");
    } else {
      expect(body.sandbox).toBe(true);
    }
  });
});
