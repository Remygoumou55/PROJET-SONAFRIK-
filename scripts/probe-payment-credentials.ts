/**
 * SONAFRIK — Probe credentials opérateurs (sans exposer les secrets)
 * Usage : npx tsx scripts/probe-payment-credentials.ts
 *
 * Appelle payment-initiate en sandbox pour chaque provider et rapporte
 * l'état : sandbox_ok | credentials_missing | edge_error
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PROVIDERS = [
  "orange_money_gn",
  "mtn_momo_gn",
  "wave_gn",
  "soutra_money",
] as const;

const TEST_EMAIL =
  process.env.SANDBOX_FINANCE_EMAIL ?? "s12b-artist-1-1782222972289@sonafrik.test";
const TEST_PASSWORD = process.env.SANDBOX_FINANCE_PASSWORD ?? "Sprint12BTest2026!";

if (!URL || !ANON) {
  console.error("❌ Variables Supabase manquantes dans .env.local");
  process.exit(1);
}

type Status = "sandbox_ok" | "credentials_missing" | "edge_error" | "unknown";

async function probeProvider(
  client: ReturnType<typeof createClient>,
  provider: (typeof PROVIDERS)[number],
): Promise<{ status: Status; detail: string }> {
  const { data, error } = await client.functions.invoke("payment-initiate", {
    body: {
      provider,
      purpose: "topup",
      amountGnf: 5000,
      phone: "+224620000000",
    },
  });

  if (error) {
    const ctx = (error as { context?: Response }).context;
    let body = error.message;
    if (ctx) {
      try {
        body = JSON.stringify(await ctx.json());
      } catch {
        /* ignore */
      }
    }
    if (body.includes("NOT_FOUND") || body.includes("not found")) {
      return { status: "edge_error", detail: "edge function non déployée" };
    }
    if (body.includes("credentials_missing") || body.includes("sandbox")) {
      return { status: "credentials_missing", detail: body.slice(0, 120) };
    }
    return { status: "unknown", detail: body.slice(0, 120) };
  }

  const intentId = (data as { intentId?: string })?.intentId;
  if (intentId) {
    const sandbox = (data as { sandbox?: boolean })?.sandbox === true;
    return {
      status: sandbox ? "sandbox_ok" : "unknown",
      detail: sandbox ? `intent sandbox ${intentId.slice(0, 8)}…` : `intent ${intentId.slice(0, 8)}…`,
    };
  }

  return { status: "unknown", detail: JSON.stringify(data).slice(0, 120) };
}

async function main() {
  console.log("🔍 Probe credentials paiements — démarrage…\n");

  const client = createClient(URL!, ANON!, { auth: { persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (signInErr) {
    console.error("❌ Connexion test échouée :", signInErr.message);
    process.exit(1);
  }

  const results: Record<string, { status: Status; detail: string }> = {};
  for (const provider of PROVIDERS) {
    results[provider] = await probeProvider(client, provider);
    const icon =
      results[provider].status === "sandbox_ok"
        ? "✅"
        : results[provider].status === "credentials_missing"
          ? "⚠️"
          : "❌";
    console.log(`${icon} ${provider} — ${results[provider].status} — ${results[provider].detail}`);
  }

  const prodReady = Object.values(results).every((r) => r.status === "sandbox_ok");
  const missing = Object.entries(results).filter(([, r]) => r.status === "credentials_missing");

  console.log("\n--- Résumé ---");
  if (prodReady) {
    console.log("Mode : SANDBOX (clés prod absentes — comportement attendu pré-lancement)");
    console.log("→ Injecter secrets Supabase avant lancement public (voir PAYMENTS_LAUNCH_CHECKLIST.md)");
  } else if (missing.length > 0) {
    console.log(`Providers sans credentials prod : ${missing.map(([k]) => k).join(", ")}`);
  }

  console.log("\nSecrets à configurer (Supabase Dashboard → Edge Functions → Secrets) :");
  console.log("  ORANGE_MONEY_API_KEY, ORANGE_MONEY_MERCHANT_KEY, ORANGE_MONEY_BASE_URL");
  console.log("  MTN_MOMO_API_KEY, MTN_MOMO_SUBSCRIPTION_KEY, MTN_MOMO_TARGET_ENV");
  console.log("  WAVE_API_KEY, WAVE_BASE_URL");
  console.log("  SOUTRA_API_KEY (si contrat actif)");
}

void main();
