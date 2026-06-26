/**
 * Re-audit Vague D — Design tokens + typage strict (juin 2026).
 * Usage: pnpm probe:vague-d-stabilisation
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join, relative } from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(__dirname, "..");
const API_SRC = resolve(ROOT, "packages/api/src");
const WEB_SRC = resolve(ROOT, "apps/web/src");
const UI_DIR = resolve(ROOT, "packages/ui/src");
const MOBILE_DIR = resolve(ROOT, "apps/mobile");
const EDGE_FN = resolve(ROOT, "supabase/functions");

const HEX_ALLOWLIST = new Set([
  "apps/web/src/app/globals.css",
  "apps/web/src/features/auth/components/GoogleAuthButton.tsx",
  "packages/ui/src/tokens/colors.ts",
]);
const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;
const TAILWIND_PALETTE =
  /\b(text|bg|border|ring|fill|stroke|from|to|via)-(red|green|blue|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-[0-9]{2,3}\b/g;

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

function walkFiles(dir: string, ext: RegExp, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(p, ext, acc);
    else if (ext.test(entry.name)) acc.push(p);
  }
  return acc;
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
        files.push(relative(ROOT, p).replace(/\\/g, "/"));
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

function staticChecks() {
  const globals = read("apps/web/src/app/globals.css");
  log(
    "D1-theme-tokens",
    globals.includes("@theme") && globals.includes("--color-vert-energie"),
    "globals.css @theme + tokens officiels",
  );

  const webHexViolations: string[] = [];
  for (const abs of walkFiles(WEB_SRC, /\.(tsx|ts)$/)) {
    const rel = relative(ROOT, abs).replace(/\\/g, "/");
    if (HEX_ALLOWLIST.has(rel)) continue;
    const matches = readFileSync(abs, "utf8").match(HEX_PATTERN) ?? [];
    if (matches.length > 0) webHexViolations.push(rel);
  }
  log(
    "D2-web-zero-hex",
    webHexViolations.length === 0,
    webHexViolations.length ? webHexViolations.join(", ") : "0 hex web (hors allowlist)",
  );

  const tailwindViolations: string[] = [];
  for (const abs of walkFiles(WEB_SRC, /\.tsx$/)) {
    const rel = relative(ROOT, abs).replace(/\\/g, "/");
    if (HEX_ALLOWLIST.has(rel)) continue;
    const matches = readFileSync(abs, "utf8").match(TAILWIND_PALETTE) ?? [];
    if (matches.length > 0) tailwindViolations.push(rel);
  }
  log(
    "D2b-no-tailwind-palette",
    tailwindViolations.length === 0,
    tailwindViolations.length ? tailwindViolations.join(", ") : "0 palette Tailwind brute",
  );

  const mobileHexViolations: string[] = [];
  for (const abs of walkFiles(MOBILE_DIR, /\.(tsx|ts)$/)) {
    const rel = relative(ROOT, abs).replace(/\\/g, "/");
    const matches = readFileSync(abs, "utf8").match(HEX_PATTERN) ?? [];
    if (matches.length > 0) mobileHexViolations.push(rel);
  }
  log(
    "D3-mobile-zero-hex",
    mobileHexViolations.length === 0,
    mobileHexViolations.length ? mobileHexViolations.join(", ") : "0 hex mobile",
  );

  const uiHexViolations: string[] = [];
  for (const abs of walkFiles(UI_DIR, /\.(tsx|ts)$/)) {
    const rel = relative(ROOT, abs).replace(/\\/g, "/");
    if (HEX_ALLOWLIST.has(rel)) continue;
    const matches = readFileSync(abs, "utf8").match(HEX_PATTERN) ?? [];
    if (matches.length > 0) uiHexViolations.push(rel);
  }
  log(
    "D3b-ui-zero-hex",
    uiHexViolations.length === 0,
    uiHexViolations.length ? uiHexViolations.join(", ") : "0 hex @sonafrik/ui (hors tokens/colors.ts)",
  );

  const webAnyFiles: string[] = [];
  for (const abs of walkFiles(WEB_SRC, /\.(tsx|ts)$/)) {
    const rel = relative(ROOT, abs).replace(/\\/g, "/");
    if (/\bas any\b/.test(readFileSync(abs, "utf8"))) webAnyFiles.push(rel);
  }
  log(
    "D4c-web-as-any",
    webAnyFiles.length === 0,
    webAnyFiles.length ? webAnyFiles.join(", ") : "0 as any web",
  );

  const apiNever = scanDir(API_SRC, /as never/g);
  log("D4-api-as-never", apiNever.total === 0, `${apiNever.total} en prod (cible 0)`);

  const apiAny = scanDir(API_SRC, /\bas any\b/g);
  log(
    "D4b-api-as-any",
    apiAny.total === 0,
    apiAny.total ? apiAny.files.join(", ") : "0 as any prod",
  );

  const edgeNever = scanDir(EDGE_FN, /as never/g);
  log("D5-edge-as-never", edgeNever.total === 0, `${edgeNever.total} edge functions`);

  const repoViolations: string[] = [];
  for (const file of listRepositoryFiles()) {
    const src = readFileSync(file, "utf8");
    if (src.includes("as never") || src.includes("as any")) {
      repoViolations.push(relative(ROOT, file).replace(/\\/g, "/"));
    }
  }
  log(
    "D6-repositories-clean",
    repoViolations.length === 0,
    repoViolations.length ? repoViolations.join(", ") : `${listRepositoryFiles().length} repos OK`,
  );

  const streamingRepo = read("packages/api/src/streaming/streaming.repository.ts");
  const streamingSchemas = read("packages/api/src/streaming/schemas.ts");
  const analyticsSchemas = read("packages/api/src/analytics/schemas.ts");
  const payoutSchemas = read("packages/api/src/payout/schemas.ts");
  const searchBeatsBlock =
    streamingRepo.match(/async searchBeats[\s\S]*?^  async /m)?.[0] ?? streamingRepo;
  log(
    "D6-searchBeats-strict",
    searchBeatsBlock.includes("if (error) throw error") &&
      !searchBeatsBlock.includes("if (error) return []"),
    "searchBeats propage les erreurs DB",
  );
  log(
    "D6b-streaming-permission-strict",
    streamingRepo.includes("async hasStreamingPermission") &&
      !streamingRepo.includes("if (error) return true"),
    "hasStreamingPermission sans fallback permissif",
  );
  log(
    "D7-perf-caps",
    streamingRepo.includes("get_creator_stream_analytics") &&
      streamingSchemas.includes("periodDays: z.number().int().min(1).max(90)") &&
      analyticsSchemas.includes(".max(90)") &&
      analyticsSchemas.includes(".max(50)") &&
      payoutSchemas.includes(".max(200)") &&
      payoutSchemas.includes(".max(100)"),
    "analytics RPC + periodDays≤90 + Zod caps",
  );

  const identityRepo = read("packages/api/src/identity/identity.repository.ts");
  const notificationsRepo = read("packages/api/src/notifications/notifications.repository.ts");
  log(
    "D8-count-unread-rpc",
    identityRepo.includes('rpc("count_unread_notifications")') &&
      notificationsRepo.includes('rpc("count_unread_notifications")') &&
      !identityRepo.includes('count: "exact", head: true'),
    "identity + notifications → RPC unique",
  );

  const paymentsService = read("packages/api/src/payments/payments.service.ts");
  log(
    "D8c-payments-list-strict",
    paymentsService.includes("async listUserIntents") &&
      paymentsService.includes('throw new PaymentError("intent_list_failed")'),
    "listUserIntents propage erreurs DB",
  );

  const paymentInitiate = read("supabase/functions/payment-initiate/index.ts");
  log(
    "D8b-payment-initiate-typed",
    paymentInitiate.includes('.from("wallets")') &&
      paymentInitiate.includes('.from("payment_intents")') &&
      !paymentInitiate.includes("as never"),
    "edge function paiement typée",
  );

  const socialRepo = read("packages/api/src/social/social.repository.ts");
  const toggleLikeBlock = socialRepo.match(/async toggleLike[\s\S]*?async toggleFavorite/)?.[0] ?? "";
  log(
    "D9-like-rpc-regression",
    toggleLikeBlock.includes('rpc("toggle_like"') && !toggleLikeBlock.includes("toggle_favorite"),
    "régression Vague C — like ≠ favorite",
  );

  log(
    "D9-probes-regression",
    existsSync(resolve(ROOT, "scripts/probe-vague-b-stabilisation.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-c-stabilisation.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-g-stabilisation.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-vague-d.ts")) &&
      existsSync(resolve(ROOT, "scripts/probe-hex-colors.ts")) &&
      existsSync(resolve(ROOT, "package.json")) &&
      read("package.json").includes("probe:vague-d-stabilisation"),
    "scripts B/C/G/D + hex + pnpm script",
  );

  log(
    "D-doc-vague-d",
    existsSync(resolve(ROOT, "docs/VAGUE_D_STABILISATION.md")),
    "VAGUE_D_STABILISATION.md",
  );
}

async function liveChecks() {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!URL || !ANON) {
    log("D10-live-env", false, ".env.local manquant");
    return;
  }

  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });
  if (signInErr) {
    log("D10-live-auth", false, signInErr.message);
    return;
  }

  const { data: beats, error: beatsErr } = await client
    .from("beats")
    .select("id, title")
    .eq("publication_status", "published")
    .is("deleted_at", null)
    .limit(3);
  log(
    "D10-live-beats-rls",
    !beatsErr,
    beatsErr?.message ?? `${(beats ?? []).length} beats publiés`,
  );

  const { error: payoutErr } = await client.rpc("get_admin_payout_queue", {
    p_status: "pending",
    p_limit: 1,
  });
  log(
    "D10-live-admin-payout-denied",
    !!payoutErr,
    payoutErr ? "non-admin OK" : "FAIL: accès non-admin",
  );

  const { data: unread, error: unreadErr } = await client.rpc("count_unread_notifications");
  log(
    "D10-live-count-unread",
    !unreadErr && typeof unread === "number",
    unreadErr?.message ?? `count=${unread}`,
  );

  const { error: openCycleErr } = await client.rpc("open_royalty_cycle", {
    p_period_start: "2026-01-01",
    p_period_end: "2026-01-31",
    p_total_revenue_gnf: 1000,
  });
  log(
    "D10-live-royalty-cycle-denied",
    !!openCycleErr,
    openCycleErr ? "refusé (non-admin attendu)" : "FAIL: accès non-admin",
  );
}

async function main() {
  console.log("=== Vague D Stabilisation — checks statiques ===\n");
  staticChecks();
  console.log("\n=== Vague D Stabilisation — checks live ===\n");
  await liveChecks();

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague D Stabilisation`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
