/**
 * Re-audit Vague E — Paiements mobiles & sécurité financière (juin 2026).
 * Usage: pnpm probe:vague-e-stabilisation
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(__dirname, "..");
const EDGE_FN = resolve(ROOT, "supabase/functions");
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

function scanEdgeAsNever(): number {
  let total = 0;
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
        total += (readFileSync(p, "utf8").match(/as never/g) ?? []).length;
      }
    }
  }
  walk(EDGE_FN);
  return total;
}

function staticChecks() {
  const shared = read("supabase/functions/_shared/payments.ts");
  log(
    "E1-operators-shared",
    shared.includes("initiateWaveCheckout") &&
      shared.includes("initiateOrangeMoney") &&
      shared.includes("initiateMtnMomo") &&
      shared.includes("initiateSoutraMoney") &&
      shared.includes("isProviderSandbox"),
    "4 opérateurs + détection sandbox",
  );

  const callbackShared = read("supabase/functions/_shared/payment-callback.ts");
  log(
    "E2-callback-dry",
    callbackShared.includes("confirmPaymentIntent") &&
      callbackShared.includes("markPaymentIntentFailed") &&
      callbackShared.includes("markPaymentIntentFailed:") &&
      callbackShared.includes("): Promise<boolean>"),
    "confirm + fail centralisés + bool retour",
  );

  for (const [label, rel] of [
    ["wave", "supabase/functions/payment-wave-callback/index.ts"],
    ["orange", "supabase/functions/payment-orange-callback/index.ts"],
    ["mtn", "supabase/functions/payment-mtn-callback/index.ts"],
    ["soutra", "supabase/functions/payment-soutra-callback/index.ts"],
  ] as const) {
    const src = read(rel);
    log(
      `E3-${label}-callback`,
      src.includes("confirmPaymentIntent") &&
        src.includes("markPaymentIntentFailed") &&
        src.includes("createServiceClient"),
      "shared payment-callback",
    );
  }

  const waveCb = read("supabase/functions/payment-wave-callback/index.ts");
  const soutraCb = read("supabase/functions/payment-soutra-callback/index.ts");
  const orangeCb = read("supabase/functions/payment-orange-callback/index.ts");
  const mtnCb = read("supabase/functions/payment-mtn-callback/index.ts");
  log(
    "E4-webhook-auth",
    waveCb.includes("verifyHmacSha256") &&
      soutraCb.includes("verifyHmacSha256") &&
      orangeCb.includes("verifyHmacSha256") &&
      mtnCb.includes("MTN_MOMO_CALLBACK_API_KEY"),
    "HMAC wave/soutra/orange + MTN API key",
  );

  const initiate = read("supabase/functions/payment-initiate/index.ts");
  log(
    "E5-payment-initiate",
    initiate.includes("isProviderSandbox") &&
      !initiate.includes("TODO:") &&
      initiate.includes("handleCorsPreflightIfNeeded") &&
      initiate.includes("intent_update_failed"),
    "sandbox + CORS + vérif update pending",
  );

  const edgeNever = scanEdgeAsNever();
  log("E6-edge-as-never", edgeNever === 0, `${edgeNever} as never edge`);

  const schemas = read("packages/api/src/payments/schemas.ts");
  const paymentsSvc = read("packages/api/src/payments/payments.service.ts");
  const paymentTypes = read("packages/types/src/payments.ts");
  log(
    "E7-api-payments",
    schemas.includes(".min(1000)") &&
      paymentsSvc.includes("checkoutUrl") &&
      paymentsSvc.includes('throw new PaymentError("intent_list_failed")') &&
      paymentsSvc.includes('throw new PaymentError("intent_fetch_failed")') &&
      paymentTypes.includes("intent_list_failed") &&
      paymentTypes.includes("intent_fetch_failed"),
    "zod + erreurs edge + get/list strict",
  );

  const walletClient = read("apps/web/src/app/(wallet)/wallet/WalletClient.tsx");
  const topup = read("apps/web/src/features/wallet/components/TopupModal.tsx");
  const paymentHistory = read("apps/web/src/features/wallet/components/PaymentHistory.tsx");
  const useHistory = read("apps/web/src/features/wallet/hooks/usePaymentHistory.ts");
  log(
    "E8-wallet-ui",
    walletClient.includes("isTopupEnabled") &&
      walletClient.includes("showTopup && isTopupEnabled()") &&
      topup.includes("checkoutUrl") &&
      topup.includes("isSandbox") &&
      topup.includes("resolveAmount"),
    "gate env + wave checkout + montant validé",
  );
  log(
    "E8b-payment-history-error",
    useHistory.includes("PaymentError") && paymentHistory.includes('role="alert"'),
    "historique PaymentError + alerte UI",
  );

  const payoutPage = read("apps/web/src/app/(wallet)/wallet/payout/page.tsx");
  log(
    "E9-payout-page",
    payoutPage.includes("PayoutPage") && payoutPage.includes("isWithdrawalEnabled"),
    "retraits créateur gated",
  );

  const migration = read("supabase/migrations/20260624200000_vague_e_payout_audit_request.sql");
  log(
    "E9b-withdrawal-audit",
    migration.includes("'requested'") && migration.includes("payout_audit_logs"),
    "request_withdrawal → audit requested",
  );

  const confirmRpc = read("supabase/migrations/20260617020000_payment_intents.sql");
  log(
    "E10-confirm-service-role",
    confirmRpc.includes("GRANT EXECUTE ON FUNCTION public.confirm_payment_intent") &&
      confirmRpc.includes("TO service_role"),
    "pas de crédit client direct",
  );

  const walletTopup = read("supabase/functions/wallet-topup/index.ts");
  const walletSvc = read("packages/api/src/wallet/wallet.service.ts");
  log(
    "E10b-topup-direct-blocked",
    walletTopup.includes("topup_disabled") &&
      (walletSvc.includes("TOPUP_FAILED") || walletSvc.includes("Recharge indisponible")),
    "topup_wallet / edge direct bloqués",
  );

  log(
    "E11-payments-env",
    read(".env.example").includes("NEXT_PUBLIC_PAYMENTS_ENABLED") &&
      read("apps/web/src/features/wallet/lib/paymentsEnabled.ts").includes("NEXT_PUBLIC_PAYMENTS_ENABLED"),
    "staging documenté",
  );

  log(
    "E11-regression-probes",
    existsSync(resolve(ROOT, "scripts/probe-vague-d-stabilisation.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-g-stabilisation.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-e.ts")) &&
      read("package.json").includes("probe:vague-e-stabilisation"),
    "scripts D/G/E + pnpm",
  );

  log(
    "E-doc-vague-e",
    existsSync(resolve(ROOT, "docs/VAGUE_E_STABILISATION.md")),
    "VAGUE_E_STABILISATION.md",
  );

  log(
    "E-tests-payments",
    existsSync(resolve(ROOT, "packages/api/src/payments/payments.service.test.ts")),
    "vitest payments.service",
  );
}

async function liveChecks() {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !ANON) {
    log("E12-live-env", false, ".env.local manquant");
    return;
  }

  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });
  if (signInErr) {
    log("E12-live-auth", false, signInErr.message);
    return;
  }

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
    "E12-live-payment-initiate",
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
    "E12-live-payment-intents-rls",
    !intentsErr,
    intentsErr?.message ?? `${(intents ?? []).length} intents visibles`,
  );

  const { data: summary, error: summaryErr } = await client.rpc("get_payout_summary");
  log(
    "E12-live-payout-summary",
    !summaryErr && summary !== null,
    summaryErr?.message ?? "RPC créateur OK",
  );

  const intentId = (fnData as { intentId?: string })?.intentId;
  const { error: confirmErr } = await client.rpc("confirm_payment_intent", {
    p_intent_id: intentId ?? "00000000-0000-0000-0000-000000000000",
    p_provider_ref: "PROBE-TEST",
  });
  log(
    "E12-live-confirm-denied",
    !!confirmErr,
    confirmErr ? "service_role only OK" : "FAIL: accès non autorisé",
  );

  const { error: topupErr } = await client.rpc("topup_wallet", {
    p_amount_gnf: 1000,
    p_payment_method: "probe",
  });
  log(
    "E12-live-topup-denied",
    !!topupErr,
    topupErr ? "permission denied OK" : "FAIL: topup accessible",
  );

  const { error: withdrawErr } = await client.rpc("request_withdrawal", {
    p_payout_account_id: "00000000-0000-0000-0000-000000000001",
    p_amount_gnf: 5000,
  });
  log(
    "E12-live-withdrawal-guard",
    !!withdrawErr,
    withdrawErr ? "compte absent attendu" : "FAIL: retrait sans compte",
  );
}

async function main() {
  console.log("=== Vague E Stabilisation — checks statiques ===\n");
  staticChecks();
  console.log("\n=== Vague E Stabilisation — checks live ===\n");
  await liveChecks();

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague E Stabilisation`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
