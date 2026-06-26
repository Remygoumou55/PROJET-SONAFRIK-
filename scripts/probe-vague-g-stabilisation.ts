/**
 * Re-audit Vague G — Complétion chaîne MVP (juin 2026).
 * Usage: pnpm probe:vague-g-stabilisation
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(__dirname, "..");
const envPath = resolve(ROOT, "apps/web/.env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
  }
}

type Check = { id: string; ok: boolean; detail: string };
const checks: Check[] = [];

function log(id: string, ok: boolean, detail: string) {
  checks.push({ id, ok, detail });
  console.log(`${ok ? "✅" : "❌"} [${id}] ${detail}`);
}

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function staticChecks() {
  const royaltiesRoute = read("apps/web/src/app/(wallet)/wallet/royalties/page.tsx");
  const royaltiesUi = read("apps/web/src/features/wallet/components/RoyaltiesPage.tsx");
  log(
    "G1-royalties-page",
    royaltiesRoute.includes("RoyaltiesPage") &&
      !royaltiesRoute.includes("ComingSoon") &&
      royaltiesRoute.includes("metadata"),
    "RoyaltiesPage branchée + metadata",
  );
  log(
    "G1-royalties-error-ui",
    royaltiesUi.includes("useRoyalties") && royaltiesUi.includes("role=\"alert\""),
    "état erreur royalties",
  );
  log(
    "G1-wallet-service-royalties",
    read("packages/api/src/wallet/wallet.service.ts").includes("getRoyaltyCalculations"),
    "WalletService.getRoyaltyCalculations",
  );

  const payments = read("apps/web/src/features/wallet/lib/paymentsEnabled.ts");
  const envExample = read(".env.example");
  log(
    "G2-payments-flag",
    payments.includes("NEXT_PUBLIC_PAYMENTS_ENABLED") &&
      envExample.includes("NEXT_PUBLIC_PAYMENTS_ENABLED"),
    "gate staging documenté",
  );
  log(
    "G2-payout-gated",
    read("apps/web/src/app/(wallet)/wallet/payout/page.tsx").includes("isWithdrawalEnabled"),
    "payout page gated",
  );

  log(
    "G2-wallet-client-withdrawal",
    read("apps/web/src/app/(wallet)/wallet/WalletClient.tsx").includes("isWithdrawalEnabled()"),
    "WalletClient → isWithdrawalEnabled (pas isTopupEnabled)",
  );

  log(
    "G1-royalties-empty-on-error",
    royaltiesUi.includes("error ? null : royalties.length"),
    "pas d'état vide si erreur chargement",
  );

  const mvpChain = read("apps/web/tests/e2e/mvp-chain.spec.ts");
  log(
    "G3-e2e-mvp-chain",
    mvpChain.includes("/wallet/royalties") && mvpChain.includes("/wallet/payout"),
    "E2E chaîne wallet étendue",
  );
  log(
    "G3-artist-journey-script",
    existsSync(resolve(ROOT, "scripts/artist-journey-live.ts")),
    "artist-journey-live.ts",
  );

  const payoutPage = read("apps/web/src/app/(wallet)/wallet/payout/page.tsx");
  log(
    "G4-payout-no-duplicate-h1",
    !payoutPage.includes("<h1") && payoutPage.includes("WalletLayoutClient") === false,
    "pas de layout dupliqué sur payout",
  );
  log(
    "G4-wallet-layout-nav",
    read("apps/web/src/features/wallet/components/WalletLayoutClient.tsx").includes(
      "/wallet/royalties",
    ),
    "nav wallet inclut royalties",
  );

  log(
    "G5-orange-money-doc",
    existsSync(resolve(ROOT, "docs/P0-2-PHASE-2-ORANGE-MONEY.md")),
    "doc credentials opérateurs",
  );

  log(
    "G-doc-vague-g",
    existsSync(resolve(ROOT, "docs/VAGUE_G_STABILISATION.md")),
    "VAGUE_G_STABILISATION.md",
  );
}

async function liveChecks() {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!URL || !ANON) {
    log("live-env", false, "env Supabase manquant");
    return;
  }

  const anon = createClient(URL, ANON, { auth: { persistSession: false } });

  const { error: signInErr } = await anon.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });
  if (signInErr) {
    log("G1-live-auth", false, signInErr.message);
    return;
  }

  const { error: cycleErr } = await anon.rpc("get_active_royalty_cycle");
  log(
    "G1-live-royalty-cycle-rpc",
    !cycleErr,
    cycleErr?.message ?? "get_active_royalty_cycle OK",
  );

  const { count, error: rcErr } = await anon
    .from("royalty_cycles")
    .select("*", { count: "exact", head: true });
  log(
    "G1-live-royalty-cycles-table",
    !rcErr && count !== null,
    rcErr?.message ?? `royalty_cycles count=${count ?? "?"}`,
  );

  const { count: calcCount, error: calcErr } = await anon
    .from("royalty_calculations")
    .select("*", { count: "exact", head: true });
  log(
    "G1-live-royalty-calculations-rls",
    !calcErr && calcCount !== null,
    calcErr?.message ?? `royalty_calculations count=${calcCount ?? "?"}`,
  );

  const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
  log(
    "G2-live-payments-staging",
    true,
    `NEXT_PUBLIC_PAYMENTS_ENABLED=${paymentsEnabled} (G5 prod = credentials Rémy)`,
  );
}

async function main() {
  console.log("=== Vague G Stabilisation — checks statiques ===\n");
  staticChecks();
  console.log("\n=== Vague G Stabilisation — checks live ===\n");
  await liveChecks();

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague G Stabilisation`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
