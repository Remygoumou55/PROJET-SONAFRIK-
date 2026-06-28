/**
 * War Plan A→E — vérification post-correction.
 * Usage: pnpm probe:war-plan
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
let passed = 0;
let total = 0;

function log(id: string, ok: boolean, detail: string): void {
  total++;
  if (ok) passed++;
  console.log(`${ok ? "✅" : "❌"} [${id}] ${detail}`);
}

console.log("=== WAR PLAN A→E — Vérification corrections ===\n");

// A
log(
  "A4",
  existsSync(resolve(ROOT, "supabase/migrations/20260624190000_war_a_creator_artist_profiles_sync.sql")),
  "migration sync creators/artist_profiles",
);
const ci = readFileSync(resolve(ROOT, ".github/workflows/ci.yml"), "utf8");
log("A5", ci.includes("pnpm test"), "CI exécute vitest");

// B
log("B2", existsSync(resolve(ROOT, "packages/shared/src/auth/devBypass.ts")), "devBypass centralisé");
log("B2b", existsSync(resolve(ROOT, "apps/web/src/lib/auth/guards.ts")), "guards web");
const mw = readFileSync(resolve(ROOT, "apps/web/src/middleware.ts"), "utf8");
log("B3", mw.includes("isAdmin !== true"), "admin middleware fail-closed");
log("B5", existsSync(resolve(ROOT, "docs/MOBILE_WEB_PARITY.md")), "doc mobile/web");

// C
log("C5", existsSync(resolve(ROOT, "apps/web/src/features/wallet/hooks/useWalletPageData.ts")), "useWalletPageData");
const globals = readFileSync(resolve(ROOT, "apps/web/src/app/globals.css"), "utf8");
log("C4", globals.includes("--overlay-vert-nav"), "tokens overlay CSS");
log("C2", existsSync(resolve(ROOT, "docs/METADATA_TABLES_ROADMAP.md")), "metadata gelé documenté");

// D
log(
  "D3",
  existsSync(resolve(ROOT, "supabase/migrations/20260624200000_war_d_stream_analytics_rpc.sql")),
  "RPC get_creator_stream_analytics",
);
const repo = readFileSync(resolve(ROOT, "packages/api/src/streaming/streaming.repository.ts"), "utf8");
log("D3b", repo.includes("get_creator_stream_analytics"), "repository utilise RPC");
log(
  "D1",
  existsSync(resolve(ROOT, "supabase/migrations/20260624210000_war_d_performance_flags_africa_prefetch.sql")),
  "flags africa + prefetch",
);

// E / roadmap
log("E5", existsSync(resolve(ROOT, "docs/ops/PAYMENT_INCIDENT_RUNBOOK.md")), "runbook paiements");
log("ROADMAP", existsSync(resolve(ROOT, "docs/ROADMAP_BLOCKERS.md")), "A1/A2 en roadmap");

const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")) as { scripts?: Record<string, string> };
log("SCRIPT", Boolean(pkg.scripts?.["probe:war-plan"]), "probe enregistré");

console.log(`\n--- Résumé ---`);
console.log(`${passed}/${total} checks War Plan`);
process.exit(passed === total ? 0 : 1);
