/**
 * SONAFRIK — Probe chaîne finance E2E (Phase D)
 * Usage : pnpm probe:finance-chain
 *
 * Vérifie : plans DB, ledger, cycles royalties, RPCs finance, payment-initiate sandbox.
 * Exit 1 si check bloquant échoue.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(__dirname, "..");
const envPath = resolve(ROOT, "apps/web/.env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
  }
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.SANDBOX_FINANCE_EMAIL ?? "s12b-artist-1-1782222972289@sonafrik.test";
const TEST_PASSWORD = process.env.SANDBOX_FINANCE_PASSWORD ?? "Sprint12BTest2026!";

type Check = { id: string; ok: boolean; detail: string; blocking: boolean };
const checks: Check[] = [];

function log(id: string, ok: boolean, detail: string, blocking = true) {
  checks.push({ id, ok, detail, blocking });
  console.log(`${ok ? "✅" : "❌"} [${id}] ${detail}`);
}

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

async function main() {
  console.log("🔍 Probe chaîne finance Phase D\n");

  log(
    "D1-royalty-tests",
    existsSync(resolve(ROOT, "packages/api/src/royalties/royalty.service.test.ts")),
    "royalty.service.test.ts présent",
    false,
  );
  log(
    "D1-payout-tests",
    existsSync(resolve(ROOT, "packages/api/src/payout/payout.service.test.ts")),
    "payout.service.test.ts présent",
    false,
  );
  log(
    "D1-wallet-tests",
    read("packages/api/src/wallet/wallet.service.test.ts").includes("getWalletContext"),
    "wallet.service.test.ts étendu",
    false,
  );
  log(
    "D1-provider-health",
    read("packages/shared/src/payment/provider-health.ts").includes("getPaymentProvidersHealth"),
    "provider-health partagé",
    false,
  );

  if (!URL || !SERVICE) {
    log("D2-env", false, "NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY requis");
    process.exit(1);
  }

  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

  const { count: planCount, error: planErr } = await admin
    .from("subscription_plans")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  log("D2-subscription-plans", !planErr && (planCount ?? 0) >= 3, `${planCount ?? 0} plans actifs`);

  const { count: ledgerCount, error: ledgerErr } = await admin
    .from("wallet_ledger")
    .select("*", { count: "exact", head: true });
  log("D2-wallet-ledger", !ledgerErr && (ledgerCount ?? 0) > 0, `${ledgerCount ?? 0} entrées ledger`);

  const { count: cycleCount, error: cycleErr } = await admin
    .from("royalty_cycles")
    .select("*", { count: "exact", head: true });
  log("D2-royalty-cycles", !cycleErr, `${cycleCount ?? 0} cycles royalties`);

  for (const rpc of [
    "calculate_royalties",
    "distribute_royalties",
    "open_royalty_cycle",
    "subscribe_premium",
    "request_withdrawal",
  ] as const) {
    const { error } = await admin.rpc(rpc, rpc === "calculate_royalties" || rpc === "distribute_royalties"
      ? { p_cycle_id: "00000000-0000-4000-8000-000000000001" }
      : rpc === "open_royalty_cycle"
        ? {
            p_period_start: "2099-01-01",
            p_period_end: "2099-01-31",
            p_total_revenue_gnf: 1,
            p_revenue_pool_percent: 65,
          }
        : rpc === "subscribe_premium"
          ? { p_plan_type: "monthly" }
          : { p_payout_account_id: "00000000-0000-4000-8000-000000000001", p_amount_gnf: 5000 });
    const exists = !error || !error.message.toLowerCase().includes("does not exist");
    log(`D2-rpc-${rpc}`, exists, exists ? "RPC présente" : error!.message);
  }

  if (URL && ANON) {
    const user = createClient(URL, ANON, { auth: { persistSession: false } });
    const { error: signInErr } = await user.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (signInErr) {
      log("D3-payment-initiate", false, `auth test: ${signInErr.message}`);
    } else {
      const { data, error } = await user.functions.invoke("payment-initiate", {
        body: {
          provider: "wave_gn",
          purpose: "topup",
          amountGnf: 5000,
          phone: "+224620000000",
        },
      });
      const ok = !error && !!(data as { intentId?: string })?.intentId;
      const sandbox = (data as { sandbox?: boolean })?.sandbox === true;
      log(
        "D3-payment-initiate",
        ok,
        ok
          ? sandbox
            ? "sandbox OK (credentials prod absentes — attendu pré-lancement)"
            : "intent créé (mode prod)"
          : error?.message ?? "échec",
      );
    }
  } else {
    log("D3-payment-initiate", false, "ANON key manquante", false);
  }

  const failed = checks.filter((c) => c.blocking && !c.ok);
  console.log(`\n--- ${checks.filter((c) => c.ok).length}/${checks.length} OK ---`);
  if (failed.length > 0) {
    console.error(`\n❌ ${failed.length} check(s) bloquant(s) échoué(s)`);
    process.exit(1);
  }
  console.log("\n✅ Chaîne finance Phase D — probes OK");
  console.log("→ Credentials prod : Supabase Secrets (ORANGE_MONEY_API_KEY, WAVE_API_KEY, …)");
}

void main();
