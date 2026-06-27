/**
 * SONAFRIK — Probe chaîne retrait sandbox
 * Usage : npx tsx scripts/probe-withdrawal-sandbox.ts
 *
 * Vérifie que les RPC wallet/payout existent et que la table withdrawals
 * est accessible (RLS service_role). Ne déclenche pas de retrait réel.
 * Exit code 1 si au moins un check échoue.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check(name: string, fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (err) {
    console.error(`❌ ${name} :`, err instanceof Error ? err.message : String(err));
    return false;
  }
}

async function rpcExists(name: string, args: Record<string, unknown> = {}): Promise<void> {
  const { error } = await supabase.rpc(name, args);
  if (!error) return;
  const msg = error.message.toLowerCase();
  if (msg.includes("permission denied") || msg.includes("not authorized")) return;
  if (msg.includes("does not exist")) throw new Error(`RPC absente : ${error.message}`);
  throw new Error(error.message);
}

async function main() {
  console.log("🔍 Probe retrait sandbox — démarrage…\n");
  const results: boolean[] = [];

  results.push(
    await check("Table withdrawals lisible", async () => {
      const { error } = await supabase.from("withdrawals").select("id").limit(1);
      if (error) throw new Error(error.message);
    }),
  );

  results.push(
    await check("Table payout_batches lisible", async () => {
      const { error } = await supabase.from("payout_batches").select("id").limit(1);
      if (error) throw new Error(error.message);
    }),
  );

  results.push(
    await check("RPC get_payout_summary existe", () => rpcExists("get_payout_summary")),
  );

  results.push(
    await check("RPC get_admin_payout_queue existe", () =>
      rpcExists("get_admin_payout_queue", { p_status: "pending", p_limit: 1 }),
    ),
  );

  results.push(
    await check("wallet_ledger > 0 entrées", async () => {
      const { count, error } = await supabase
        .from("wallet_ledger")
        .select("*", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      if ((count ?? 0) === 0) throw new Error("wallet_ledger vide — topup sandbox requis");
    }),
  );

  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} checks OK`);

  if (passed < results.length) {
    console.log("\n→ Voir docs/PAYMENTS_LAUNCH_CHECKLIST.md étape 2 (sandbox staging)");
    process.exit(1);
  }

  console.log("\n✅ Infrastructure retrait prête pour sandbox E2E.");
  console.log("→ Prochaine étape : topup sandbox + request_withdrawal manuel (Rémy).");
}

void main();
