/**
 * SONAFRIK — Sandbox E2E finance (staging/prod linked DB)
 * Usage : npx tsx scripts/run-finance-sandbox-e2e.ts
 *
 * Compte certifié Sprint 12B — crédite via confirm_payment_intent (sandbox),
 * crée un payout_account, demande un retrait 5 000 GNF.
 * Nécessite SUPABASE_SERVICE_ROLE_KEY + .env.local
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../apps/web/.env.local");
if (existsSync(envPath) && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
  }
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ARTIST_EMAIL =
  process.env.SANDBOX_FINANCE_EMAIL ?? "s12b-artist-1-1782222972289@sonafrik.test";
const ARTIST_PASSWORD = process.env.SANDBOX_FINANCE_PASSWORD ?? "Sprint12BTest2026!";
const TOPUP_GNF = 10_000;
const WITHDRAWAL_GNF = 5_000;

if (!URL || !ANON || !SERVICE) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL, ANON_KEY et SUPABASE_SERVICE_ROLE_KEY requis.");
  process.exit(1);
}

async function sandboxTopup(userClient: SupabaseClient, admin: SupabaseClient, userId: string) {
  const { data: wallet, error: walletErr } = await userClient
    .from("wallets")
    .select("id, balance_gnf")
    .eq("user_id", userId)
    .maybeSingle();

  if (walletErr || !wallet?.id) throw new Error(walletErr?.message ?? "wallet_not_found");

  const balance = Number(wallet.balance_gnf);
  if (balance >= WITHDRAWAL_GNF) {
    console.log(`✅ Solde suffisant (${balance} GNF) — topup ignoré`);
    return balance;
  }

  const { data: intent, error: insertErr } = await userClient
    .from("payment_intents")
    .insert({
      user_id: userId,
      wallet_id: wallet.id,
      provider: "orange_money_gn",
      purpose: "topup",
      amount_gnf: TOPUP_GNF,
      provider_phone: "sandbox-e2e",
      status: "initiated",
      metadata: { sandbox: true, source: "run-finance-sandbox-e2e" },
    })
    .select("id")
    .single();

  if (insertErr || !intent?.id) throw new Error(insertErr?.message ?? "intent_creation_failed");

  const { error: confirmErr } = await admin.rpc("confirm_payment_intent", {
    p_intent_id: intent.id,
    p_provider_ref: `sandbox-e2e-${intent.id}`,
  });

  if (confirmErr) throw new Error(confirmErr.message);

  const { data: updated } = await userClient
    .from("wallets")
    .select("balance_gnf")
    .eq("user_id", userId)
    .single();

  const newBalance = Number(updated?.balance_gnf ?? 0);
  console.log(`✅ Topup sandbox ${TOPUP_GNF} GNF → solde ${newBalance} GNF`);
  return newBalance;
}

async function ensurePayoutAccount(userClient: SupabaseClient): Promise<string> {
  const { data: existing } = await userClient
    .from("payout_accounts")
    .select("id")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    console.log(`✅ payout_account existant ${existing.id}`);
    return existing.id;
  }

  const { data: accountId, error } = await userClient.rpc("add_payout_account", {
    p_type: "orange_money",
    p_display_name: "Sandbox E2E Orange GN",
    p_account_holder_name: "S12B Artist Cert",
    p_phone_number: "+224620000001",
    p_is_default: true,
  });

  if (error || !accountId) throw new Error(error?.message ?? "add_payout_account_failed");
  console.log(`✅ payout_account créé ${accountId}`);
  return accountId as string;
}

async function requestWithdrawal(userClient: SupabaseClient, payoutAccountId: string) {
  const { data: withdrawalId, error } = await userClient.rpc("request_withdrawal", {
    p_payout_account_id: payoutAccountId,
    p_amount_gnf: WITHDRAWAL_GNF,
  });

  if (error) throw new Error(error.message);
  console.log(`✅ withdrawal demandé ${withdrawalId} (${WITHDRAWAL_GNF} GNF)`);
  return withdrawalId as string;
}

async function main() {
  console.log("🔍 Finance sandbox E2E — démarrage…\n");
  console.log(`   Compte : ${ARTIST_EMAIL}\n`);

  const userClient = createClient(URL!, ANON!, { auth: { persistSession: false } });
  const admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } });

  const { error: signInErr } = await userClient.auth.signInWithPassword({
    email: ARTIST_EMAIL,
    password: ARTIST_PASSWORD,
  });
  if (signInErr) throw new Error(`Connexion échouée : ${signInErr.message}`);

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) throw new Error("Utilisateur introuvable après connexion");

  await admin.from("wallets").upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });

  await sandboxTopup(userClient, admin, user.id);
  const payoutAccountId = await ensurePayoutAccount(userClient);
  await requestWithdrawal(userClient, payoutAccountId);

  const { data: withdrawalRows, error: wErr } = await userClient
    .from("withdrawals")
    .select("id")
    .limit(1);
  if (wErr) throw new Error(`withdrawals: ${wErr.message}`);

  const { data: payoutRows, error: pErr } = await userClient
    .from("payout_accounts")
    .select("id")
    .is("deleted_at", null)
    .limit(1);
  if (pErr) throw new Error(`payout_accounts: ${pErr.message}`);

  const { count: withdrawalTotal } = await userClient
    .from("withdrawals")
    .select("*", { count: "exact", head: true });

  const { count: payoutTotal } = await userClient
    .from("payout_accounts")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  console.log(`\n📊 withdrawals (compte test) : ${withdrawalTotal ?? withdrawalRows?.length ?? 0}`);
  console.log(`📊 payout_accounts (compte test) : ${payoutTotal ?? payoutRows?.length ?? 0}`);

  if ((withdrawalTotal ?? withdrawalRows?.length ?? 0) < 1) {
    console.error("\n❌ E2E incomplet — withdrawals toujours à 0");
    process.exit(1);
  }
  if ((payoutTotal ?? payoutRows?.length ?? 0) < 1) {
    console.error("\n❌ E2E incomplet — payout_accounts toujours à 0");
    process.exit(1);
  }

  console.log("\n✅ Chaîne finance sandbox E2E validée.");
}

main().catch((err) => {
  console.error("\n❌", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
