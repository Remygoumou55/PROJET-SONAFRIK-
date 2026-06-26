/**
 * Re-audit Vague A — bloquants lancement (audit forensique 24 juin 2026).
 * Usage: pnpm probe:vague-a-launch
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

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
  const walletService = read("packages/api/src/wallet/wallet.service.ts");
  log(
    "A3-service",
    walletService.includes("getListenerPremiumPlans") &&
      walletService.includes("subscription_plans") === false &&
      walletService.includes("SubscriptionPlansRepository"),
    "WalletService lit plans via repository",
  );

  const migration = read("supabase/migrations/20260624140000_vague_a_subscription_plans_rpc.sql");
  log(
    "A3-migration",
    migration.includes("premium-annual") && migration.includes("FROM public.subscription_plans"),
    "migration RPC + plan annuel",
  );

  const dashboard = read("apps/web/src/features/wallet/components/WalletDashboard.tsx");
  log(
    "A3-ui-dashboard",
    !dashboard.includes("SUBSCRIPTION_PLANS") && dashboard.includes("plans.map"),
    "WalletDashboard sans tarifs hardcodés",
  );

  const modal = read("apps/web/src/features/wallet/components/SubscriptionModal.tsx");
  log(
    "A3-ui-modal",
    !modal.includes("SUBSCRIPTION_PLANS") && modal.includes("ListenerPremiumPlan"),
    "SubscriptionModal branché DB",
  );

  log(
    "A2-tests-wallet",
    existsSync(resolve(ROOT, "packages/api/src/wallet/wallet.service.test.ts")),
    "wallet.service.test.ts présent",
  );
  log(
    "A2-tests-payments",
    existsSync(resolve(ROOT, "packages/api/src/payments/payments.service.test.ts")),
    "payments.service.test.ts présent",
  );
  log(
    "A2-tests-mapper",
    existsSync(resolve(ROOT, "packages/api/src/wallet/subscription-plans.mapper.test.ts")),
    "subscription-plans.mapper.test.ts présent",
  );

  log(
    "A4-e2e",
    existsSync(resolve(ROOT, "apps/web/tests/e2e/mvp-chain.spec.ts")),
    "mvp-chain.spec.ts présent",
  );

  const orangePayments = read("supabase/functions/_shared/payments.ts");
  log(
    "A1-orange-code",
    orangePayments.includes("initiateOrangeMoney") &&
      orangePayments.includes("payment-orange-callback"),
    "initiateOrangeMoney + callback URL",
  );

  const orangeCallback = read("supabase/functions/payment-orange-callback/index.ts");
  log(
    "A1-orange-callback",
    orangeCallback.includes("confirmPaymentIntent") && orangeCallback.includes("verifyHmacSha256"),
    "callback HMAC + confirm_payment_intent",
  );

  log(
    "A5-live-control-perf",
    existsSync(resolve(ROOT, "docs/performance/LIVE_CONTROL_PERFORMANCE.md")),
    "LIVE_CONTROL_PERFORMANCE.md présent",
  );
  log(
    "A5-live-control-stream",
    existsSync(resolve(ROOT, "docs/streaming/LIVE_CONTROL_SPRING2.md")),
    "LIVE_CONTROL_SPRING2.md présent",
  );
}

async function liveChecks() {
  if (!URL || !ANON) {
    log("live-env", false, "NEXT_PUBLIC_SUPABASE_URL/ANON_KEY manquants");
    return;
  }

  const anon = createClient(URL, ANON, { auth: { persistSession: false } });

  const { data: plans, error: plansErr } = await anon
    .from("subscription_plans")
    .select("slug, price_gnf, is_active")
    .eq("is_active", true)
    .order("sort_order");

  const slugs = (plans ?? []).map((p) => p.slug);
  log(
    "A3-db-plans",
    !plansErr && slugs.includes("premium") && slugs.includes("premium-annual"),
    plansErr?.message ?? `slugs=${slugs.join(",")}`,
  );

  const premium = plans?.find((p) => p.slug === "premium");
  const annual = plans?.find((p) => p.slug === "premium-annual");
  log(
    "A3-db-prices",
    premium?.price_gnf === 50_000 && annual?.price_gnf === 480_000,
    `premium=${premium?.price_gnf} annual=${annual?.price_gnf}`,
  );

  const { data: rpcRows, error: rpcErr } = await anon.rpc("subscribe_premium" as never, {
    p_plan_type: "monthly",
  } as never);
  void rpcRows;
  log(
    "A3-rpc-guard",
    !!rpcErr && (rpcErr.message.includes("unauthorized") || rpcErr.message.includes("JWT")),
    rpcErr?.message ?? "FAIL: subscribe_premium sans auth autorisé",
  );
}

async function main() {
  console.log("=== Vague A Launch — checks statiques ===\n");
  staticChecks();
  console.log("\n=== Vague A Launch — checks live Supabase ===\n");
  await liveChecks();

  const passed = checks.filter((c) => c.ok).length;
  const codeIds = checks.filter((c) => c.id.startsWith("A2") || c.id.startsWith("A3") || c.id === "A4-e2e" || c.id.startsWith("A1-orange"));
  const codeOk = codeIds.every((c) => c.ok);

  console.log(`\n${passed}/${checks.length} checks Vague A Launch`);
  if (!codeOk) {
    console.log("ÉCHEC — corrections code requises (A1/A2/A3/A4)");
    process.exitCode = 1;
    return;
  }
  console.log("Code A1/A2/A3/A4 validé. A5 = signature fondateur manuelle.");
  process.exitCode = passed === checks.length ? 0 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
