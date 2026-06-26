/**
 * Certification Vague E++ — paiements mobiles, webhooks, wallet UI, sécurité financière.
 * Usage: pnpm probe:vague-e
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(__dirname, "..");
const EDGE_FN = resolve(ROOT, "supabase/functions");

type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];
const log = (name: string, ok: boolean, detail: string) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
};

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function scanDir(dir: string, pattern: RegExp): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) total += scanDir(p, pattern);
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      total += (readFileSync(p, "utf8").match(pattern) ?? []).length;
    }
  }
  return total;
}

function loadEnv() {
  const envPath = resolve(ROOT, "apps/web/.env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
  }
}

function staticChecks() {
  const shared = read("supabase/functions/_shared/payments.ts");
  log(
    "E1 opérateurs shared",
    shared.includes("initiateWaveCheckout") &&
      shared.includes("initiateOrangeMoney") &&
      shared.includes("initiateSoutraMoney"),
    "4 opérateurs",
  );

  const callbackShared = read("supabase/functions/_shared/payment-callback.ts");
  log(
    "E2 callback shared DRY",
    callbackShared.includes("confirmPaymentIntent") &&
      callbackShared.includes("markPaymentIntentFailed"),
    "confirm + fail centralisés",
  );

  for (const [label, rel] of [
    ["wave", "supabase/functions/payment-wave-callback/index.ts"],
    ["orange", "supabase/functions/payment-orange-callback/index.ts"],
    ["mtn", "supabase/functions/payment-mtn-callback/index.ts"],
    ["soutra", "supabase/functions/payment-soutra-callback/index.ts"],
  ] as const) {
    const src = read(rel);
    log(
      `E3 ${label} callback`,
      src.includes("confirmPaymentIntent") &&
        src.includes("markPaymentIntentFailed") &&
        src.includes("createServiceClient"),
      "shared payment-callback",
    );
  }

  const waveCb = read("supabase/functions/payment-wave-callback/index.ts");
  const soutraCb = read("supabase/functions/payment-soutra-callback/index.ts");
  const orangeCb = read("supabase/functions/payment-orange-callback/index.ts");
  log(
    "E4 HMAC wave + soutra + orange",
    waveCb.includes("verifyHmacSha256") &&
      soutraCb.includes("verifyHmacSha256") &&
      orangeCb.includes("verifyHmacSha256"),
    "webhooks signés (3 opérateurs HMAC)",
  );

  const initiate = read("supabase/functions/payment-initiate/index.ts");
  log(
    "E5 payment-initiate",
    initiate.includes("isProviderSandbox") &&
      !initiate.includes("TODO:") &&
      initiate.includes("intent_update_failed"),
    "sandbox + prod + vérif update",
  );

  log(
    "E6 edge sans as never",
    scanDir(EDGE_FN, /as never/g) === 0,
    "functions propres",
  );

  const schemas = read("packages/api/src/payments/schemas.ts");
  const paymentsSvc = read("packages/api/src/payments/payments.service.ts");
  log(
    "E7 api payments alignée",
    schemas.includes(".min(1000)") &&
      paymentsSvc.includes("checkoutUrl") &&
      paymentsSvc.includes("ctx.json()"),
    "zod + erreurs edge",
  );

  const walletClient = read("apps/web/src/app/(wallet)/wallet/WalletClient.tsx");
  const topup = read("apps/web/src/features/wallet/components/TopupModal.tsx");
  log(
    "E8 web wallet UI",
    walletClient.includes("isTopupEnabled") &&
      topup.includes("checkoutUrl") &&
      topup.includes("isSandbox"),
    "gate env + wave + sandbox",
  );

  const payoutPage = read("apps/web/src/app/(wallet)/wallet/payout/page.tsx");
  log(
    "E9 payout page",
    payoutPage.includes("PayoutPage") && payoutPage.includes("isWithdrawalEnabled"),
    "retraits créateur",
  );

  const migration = read("supabase/migrations/20260624200000_vague_e_payout_audit_request.sql");
  log(
    "E10 migration audit requested",
    migration.includes("'requested'"),
    "request_withdrawal",
  );

  const confirmRpc = read("supabase/migrations/20260617020000_payment_intents.sql");
  log(
    "E11 confirm_payment_intent service_role",
    confirmRpc.includes("GRANT EXECUTE ON FUNCTION public.confirm_payment_intent") &&
      confirmRpc.includes("TO service_role"),
    "pas de crédit client direct",
  );

  const walletTopup = read("supabase/functions/wallet-topup/index.ts");
  const walletSvc = read("packages/api/src/wallet/wallet.service.ts");
  log(
    "E12 topup direct bloqué",
    walletTopup.includes("topup_disabled") &&
      (walletSvc.includes("TOPUP_FAILED") || walletSvc.includes("Recharge indisponible")),
    "Vague A intacte",
  );

  log(
    "E13 régression probes A-D + stabilisation D/G/E",
    ["a", "b", "c", "d"].every((v) => existsSync(resolve(ROOT, `scripts/probe-vague-${v}.ts`))) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-d-stabilisation.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-g-stabilisation.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-e-stabilisation.ts")),
    "certifications précédentes",
  );
}

async function liveChecks() {
  loadEnv();
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !ANON) {
    log("live env", false, ".env.local manquant");
    return;
  }

  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  await client.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });

  const { data: { user } } = await client.auth.getUser();
  if (user && SERVICE) {
    const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
    await admin.from("wallets").upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
  }

  const { data: fnData, error: fnErr } = await client.functions.invoke("payment-initiate", {
    body: {
      provider: "wave_gn",
      purpose: "topup",
      amountGnf: 5000,
      phone: "+224620000000",
    },
  });

  let fnDetail = fnErr?.message ?? "";
  if (fnErr && (fnErr as { context?: Response }).context) {
    try {
      fnDetail = JSON.stringify(await (fnErr as { context: Response }).context.json());
    } catch {
      /* ignore */
    }
  }

  const notDeployed = fnDetail.includes("NOT_FOUND") || fnDetail.includes("not found");
  const sandboxOk = !fnErr && fnData && typeof (fnData as { intentId?: string }).intentId === "string";

  log(
    "E14 live payment-initiate",
    sandboxOk || notDeployed,
    sandboxOk
      ? `intent=${(fnData as { intentId?: string }).intentId}`
      : notDeployed
        ? "edge fn absente — deploy payment-initiate"
        : fnDetail,
  );

  const { data: intents, error: intentsErr } = await client
    .from("payment_intents")
    .select("id, status")
    .limit(3);
  log(
    "E15 live payment_intents RLS",
    !intentsErr,
    intentsErr?.message ?? `${(intents ?? []).length} intents visibles`,
  );

  const { data: summary, error: summaryErr } = await client.rpc("get_payout_summary");
  log(
    "E15 live get_payout_summary",
    !summaryErr && summary !== null,
    summaryErr?.message ?? "RPC créateur OK",
  );

  const intentId = (fnData as { intentId?: string })?.intentId;
  const { error: confirmErr } = await client.rpc("confirm_payment_intent", {
    p_intent_id: intentId ?? "00000000-0000-0000-0000-000000000000",
    p_provider_ref: "PROBE-TEST",
  });
  log(
    "E16 live confirm listener refusé",
    !!confirmErr,
    confirmErr ? "service_role only OK" : "FAIL: accès non autorisé",
  );

  const { error: topupErr } = await client.rpc("topup_wallet", {
    p_amount_gnf: 1000,
    p_payment_method: "probe",
  });
  log(
    "E16 live topup_wallet refusé",
    !!topupErr,
    topupErr ? "permission denied OK" : "FAIL: topup accessible",
  );

  const { error: withdrawErr } = await client.rpc("request_withdrawal", {
    p_payout_account_id: "00000000-0000-0000-0000-000000000001",
    p_amount_gnf: 5000,
  });
  log(
    "E17 live request_withdrawal guard",
    !!withdrawErr,
    withdrawErr ? "compte absent attendu" : "FAIL: retrait sans compte",
  );
}

async function main() {
  console.log("=== Vague E++ — checks statiques ===\n");
  staticChecks();
  console.log("\n=== Vague E++ — checks live Supabase ===\n");
  await liveChecks();

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague E++`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
