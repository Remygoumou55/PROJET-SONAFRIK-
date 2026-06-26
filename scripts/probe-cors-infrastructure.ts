/**
 * CORS Infrastructure Hardening — certification statique + preflight live.
 * Usage: pnpm probe:cors
 */
import { existsSync, readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const FUNCTIONS_DIR = resolve(ROOT, "supabase/functions");

const BROWSER_FUNCTIONS = [
  "audit-log",
  "avatar-signed-url",
  "catalog-asset-signed-url",
  "creator-asset-signed-url",
  "payment-initiate",
  "stream-complete",
  "stream-progress",
  "stream-start",
  "wallet-request-withdrawal",
  "wallet-topup",
] as const;

const WEBHOOK_FUNCTIONS = [
  "payment-mtn-callback",
  "payment-orange-callback",
  "payment-soutra-callback",
  "payment-wave-callback",
] as const;

let passed = 0;
let total = 0;

function log(id: string, ok: boolean, detail: string): void {
  total++;
  if (ok) passed++;
  console.log(`${ok ? "✅" : "❌"} [${id}] ${detail}`);
}

function read(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

async function main(): Promise<void> {
console.log("=== CORS INFRASTRUCTURE HARDENING — Certification ===\n");

// Phase A/C — module central
const corsTs = read("supabase/functions/_shared/cors.ts");
const policyTs = read("supabase/functions/_shared/cors-policy.ts");
log("CORS-MODULE", existsSync(resolve(ROOT, "supabase/functions/_shared/cors-policy.ts")), "cors-policy.ts présent");
log("CORS-DYNAMIC", corsTs.includes("buildCorsHeaders(req)"), "buildCorsHeaders dynamique");
log("CORS-NO-STATIC", !corsTs.includes("export const CORS_HEADERS"), "plus de CORS_HEADERS statique");
log("CORS-LOCALHOST", policyTs.includes("http://localhost:3000"), "localhost dans whitelist");
log("CORS-NO-WILDCARD", !policyTs.includes('"*"') && !policyTs.includes("'*'"), "pas de wildcard");
log("CORS-CREDENTIALS", policyTs.includes("Access-Control-Allow-Credentials"), "credentials supportés");
log("CORS-PREFLIGHT", corsTs.includes("handleCorsPreflightIfNeeded"), "preflight centralisé");
log("CORS-WEBHOOK", corsTs.includes("handleWebhookPreflightIfNeeded"), "webhook preflight centralisé");
log("CORS-DOCS", existsSync(resolve(ROOT, "docs/infrastructure/CORS_ARCHITECTURE.md")), "documentation officielle");

// Phase B/H — toutes les fonctions migrées
for (const name of BROWSER_FUNCTIONS) {
  const src = read(`supabase/functions/${name}/index.ts`);
  log(
    `FN-${name}`,
    src.includes("../_shared/cors.ts") &&
      (src.includes("buildCorsHeaders") || src.includes("corsJsonResponse")) &&
      src.includes("handleCorsPreflightIfNeeded") &&
      !src.includes("CORS_HEADERS"),
    `${name} → module partagé`,
  );
}

for (const name of WEBHOOK_FUNCTIONS) {
  const src = read(`supabase/functions/${name}/index.ts`);
  log(
    `WH-${name}`,
    src.includes("handleWebhookPreflightIfNeeded") && src.includes("../_shared/cors.ts"),
    `${name} → webhook preflight`,
  );
}

// Aucune duplication hors _shared
const allFunctionFiles = readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => resolve(FUNCTIONS_DIR, d.name, "index.ts"));

let hardcodedOrigin = 0;
for (const file of allFunctionFiles) {
  const content = readFileSync(file, "utf8");
  if (content.includes("Access-Control-Allow-Origin") && !content.includes("../_shared/cors.ts")) {
    hardcodedOrigin++;
  }
  if (content.includes('Access-Control-Allow-Origin: "*"') || content.includes('"*"')) {
    if (!file.includes("_shared")) hardcodedOrigin++;
  }
}
log("CORS-NO-DUP", hardcodedOrigin === 0, `${hardcodedOrigin} origines codées en dur hors module`);

// Preflight live (optionnel si SUPABASE_URL + anon)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

async function probePreflight(fn: string): Promise<boolean> {
  if (!supabaseUrl || !anonKey) return true;
  const url = `${supabaseUrl}/functions/v1/${fn}`;
  const res = await fetch(url, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization, content-type",
    },
  });
  const acao = res.headers.get("Access-Control-Allow-Origin");
  return res.status === 204 && acao === "http://localhost:3000";
}

if (supabaseUrl && anonKey) {
  console.log("\n--- Preflight live (localhost) ---\n");
  for (const fn of ["catalog-asset-signed-url", "stream-start", "payment-initiate"] as const) {
    try {
      const ok = await probePreflight(fn);
      log(`LIVE-OPT-${fn}`, ok, `OPTIONS localhost → ${ok ? "204 + ACAO localhost" : "échec"}`);
    } catch (e) {
      log(`LIVE-OPT-${fn}`, false, e instanceof Error ? e.message : String(e));
    }
  }
} else {
  log("LIVE-SKIP", true, "preflight live ignoré (pas de SUPABASE_URL/ANON en env)");
}

console.log(`\n--- Résumé ---`);
console.log(`${passed}/${total} checks CORS`);
process.exit(passed === total ? 0 : 1);
}

void main();
