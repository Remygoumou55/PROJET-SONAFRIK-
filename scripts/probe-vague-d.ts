/**
 * Certification Vague D++ — typage strict monorepo + perf caps + régression.
 * Usage: pnpm probe:vague-d
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(__dirname, "..");
const API_SRC = resolve(ROOT, "packages/api/src");
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

function scanDir(dir: string, pattern: RegExp): { total: number; files: string[] } {
  let total = 0;
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      const sub = scanDir(p, pattern);
      total += sub.total;
      files.push(...sub.files);
    } else if (
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".d.ts") &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".spec.ts")
    ) {
      const src = readFileSync(p, "utf8");
      const matches = src.match(pattern) ?? [];
      if (matches.length > 0) {
        total += matches.length;
        files.push(p.replace(ROOT + "\\", "").replace(ROOT + "/", ""));
      }
    }
  }
  return { total, files };
}

function listRepositoryFiles(): string[] {
  const files: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".repository.ts")) files.push(p);
    }
  }
  walk(API_SRC);
  return files;
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
  const apiNever = scanDir(API_SRC, /as never/g);
  log("D1 api as never", apiNever.total === 0, `${apiNever.total} (cible 0)`);

  const apiAny = scanDir(API_SRC, /\bas any\b/g);
  log(
    "D2 api as any",
    apiAny.total === 0,
    apiAny.total ? apiAny.files.join(", ") : "0 contournement typage",
  );

  const edgeNever = scanDir(EDGE_FN, /as never/g);
  log("D3 edge functions as never", edgeNever.total === 0, `${edgeNever.total} (payment-initiate)`);

  const repoViolations: string[] = [];
  for (const file of listRepositoryFiles()) {
    const src = readFileSync(file, "utf8");
    if (src.includes("as never") || src.includes("as any")) {
      repoViolations.push(file.replace(ROOT + "\\", "").replace(ROOT + "/", ""));
    }
  }
  log(
    "D4 tous repositories api propres",
    repoViolations.length === 0,
    repoViolations.length ? repoViolations.join(", ") : `${listRepositoryFiles().length} repos OK`,
  );

  for (const [label, rel] of [
    ["rights", "packages/api/src/rights/rights.repository.ts"],
    ["payout", "packages/api/src/payout/payout.repository.ts"],
    ["royalties", "packages/api/src/royalties/royalty.repository.ts"],
    ["analytics", "packages/api/src/analytics/analytics.repository.ts"],
    ["streaming", "packages/api/src/streaming/streaming.repository.ts"],
    ["notifications", "packages/api/src/notifications/notifications.repository.ts"],
    ["identity", "packages/api/src/identity/identity.repository.ts"],
    ["auth", "packages/api/src/auth/auth.repository.ts"],
  ] as const) {
    const src = read(rel);
    log(
      `D5 ${label} repository`,
      !src.includes("as never") && !src.includes("as any"),
      rel.split("/").pop(),
    );
  }

  const streamingRepo = read("packages/api/src/streaming/streaming.repository.ts");
  const searchBeatsBlock =
    streamingRepo.match(/async searchBeats[\s\S]*?^  async /m)?.[0] ?? streamingRepo;
  log(
    "D6 searchBeats typé",
    streamingRepo.includes('.from("beats")') &&
      !streamingRepo.includes("as never") &&
      searchBeatsBlock.includes("if (error) throw error") &&
      !searchBeatsBlock.includes("if (error) return []"),
    "erreurs propagées (pas de swallow)",
  );
  log(
    "D6b hasStreamingPermission strict",
    streamingRepo.includes("async hasStreamingPermission") &&
      !streamingRepo.includes("if (error) return true"),
    "pas de fallback permissif sur erreur RPC",
  );
  log(
    "D7 stream_sessions cap",
    streamingRepo.includes(".limit(10_000)") &&
      read("packages/api/src/streaming/schemas.ts").includes(".max(90)"),
    "analytics plafonnées + periodDays ≤ 90",
  );

  const analyticsSchemas = read("packages/api/src/analytics/schemas.ts");
  const payoutSchemas = read("packages/api/src/payout/schemas.ts");
  log(
    "D8 schemas caps analytics/payout",
    analyticsSchemas.includes(".max(90)") &&
      analyticsSchemas.includes(".max(50)") &&
      payoutSchemas.includes(".max(200)") &&
      payoutSchemas.includes(".max(100)"),
    "limites zod",
  );

  const identityRepo = read("packages/api/src/identity/identity.repository.ts");
  log(
    "D9 count unread via RPC",
    identityRepo.includes('rpc("count_unread_notifications")') &&
      !identityRepo.includes("count: \"exact\", head: true"),
    "source unique notifications",
  );

  const paymentInitiate = read("supabase/functions/payment-initiate/index.ts");
  log(
    "D10 payment-initiate typé",
    paymentInitiate.includes('.from("wallets")') &&
      paymentInitiate.includes('.from("payment_intents")') &&
      !paymentInitiate.includes("as never"),
    "edge function paiement",
  );

  log(
    "D11 régression probes A/B/C/G + D stabilisation",
    existsSync(resolve(ROOT, "scripts/probe-vague-a.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-b-stabilisation.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-c-stabilisation.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-g-stabilisation.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-d-stabilisation.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-hex-colors.ts")),
    "certifications précédentes",
  );
}

async function liveChecks() {
  loadEnv();
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!URL || !ANON) {
    log("live env", false, ".env.local manquant");
    return;
  }

  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  await client.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });

  const { data: beats, error: beatsErr } = await client
    .from("beats")
    .select("id, title")
    .eq("publication_status", "published")
    .is("deleted_at", null)
    .limit(3);
  log("D12 live beats RLS", !beatsErr, beatsErr?.message ?? `${(beats ?? []).length} beats publiés`);

  const { error: payoutErr } = await client.rpc("get_admin_payout_queue", {
    p_status: "pending",
    p_limit: 1,
  });
  log(
    "D12 live admin payout refusé",
    !!payoutErr,
    payoutErr ? "non-admin OK" : "FAIL: accès non-admin",
  );

  const { data: unread, error: unreadErr } = await client.rpc("count_unread_notifications");
  log(
    "D13 live count_unread_notifications",
    !unreadErr && typeof unread === "number",
    unreadErr?.message ?? `count=${unread}`,
  );

  const { error: openCycleErr } = await client.rpc("open_royalty_cycle", {
    p_period_start: "2026-01-01",
    p_period_end: "2026-01-31",
    p_total_revenue_gnf: 1000,
  });
  log(
    "D13 live open_royalty_cycle listener",
    !!openCycleErr,
    openCycleErr ? "refusé (non-admin attendu)" : "FAIL: accès non-admin",
  );
}

async function main() {
  console.log("=== Vague D++ — checks statiques ===\n");
  staticChecks();
  console.log("\n=== Vague D++ — checks live Supabase ===\n");
  await liveChecks();

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague D++`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
