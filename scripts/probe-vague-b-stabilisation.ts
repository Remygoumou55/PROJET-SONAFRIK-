/**
 * Re-audit Vague B — Stabilisation (audit forensique 26 juin 2026).
 * Usage: pnpm probe:vague-b-stabilisation
 */
import { readFileSync, existsSync, readdirSync } from "fs";
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
  const dbTypes = read("packages/database/src/types/index.ts");
  log(
    "B1-types-subscription",
    dbTypes.includes("subscription_plans: {") && dbTypes.includes("price_gnf"),
    "table subscription_plans typée",
  );
  log(
    "B1-gen-types-script",
    existsSync(resolve(ROOT, "scripts/gen-types.ts")),
    "scripts/gen-types.ts présent",
  );

  const middleware = read("apps/web/src/middleware.ts");
  log(
    "B2-middleware-session",
    middleware.includes("getSession()") && middleware.includes("withTimeout"),
    "getSession local + timeout getUser",
  );

  log(
    "B3-flags-rollback-doc",
    existsSync(resolve(ROOT, "docs/VAGUE_B_FLAGS_ROLLBACK.md")),
    "doc rollback flags",
  );

  const e2eDir = resolve(ROOT, "apps/web/tests/e2e");
  const specs = readdirSync(e2eDir).filter((f) => f.endsWith(".spec.ts"));
  log(
    "B4-e2e-specs",
    specs.length >= 6 && specs.includes("library.spec.ts") && specs.includes("wallet.spec.ts"),
    `${specs.length} specs: ${specs.join(", ")}`,
  );

  const nextConfig = read("apps/web/next.config.ts");
  const scriptSrcMatch = nextConfig.match(
    /const scriptSrc = isProd\s*\?\s*`([^`]+)`\s*:\s*`([^`]+)`/,
  );
  const prodBranch = scriptSrcMatch?.[1] ?? "";
  const devBranch = scriptSrcMatch?.[2] ?? "";
  log(
    "B5-csp-prod",
    !prodBranch.includes("unsafe-eval") &&
      devBranch.includes("unsafe-eval") &&
      prodBranch.includes("unsafe-inline"),
    "prod sans unsafe-eval, dev avec unsafe-eval",
  );

  log(
    "B2-middleware-admin-fallback",
    middleware.includes("isAdminResult === false") && middleware.includes("null,"),
    "admin timeout ne bloque pas (SSR fallback)",
  );

  log(
    "B-doc-vague-b",
    existsSync(resolve(ROOT, "docs/VAGUE_B_STABILISATION.md")),
    "VAGUE_B_STABILISATION.md",
  );
}

async function liveChecks() {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!URL || !ANON) {
    log("live-env", false, "env Supabase manquant");
    return;
  }

  const anon = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: flags, error } = await anon.from("feature_flags").select("name, enabled");
  if (error) {
    log("B3-flags-count", false, error.message);
    return;
  }

  const enabled = (flags ?? []).filter((f) => f.enabled);
  log(
    "B3-flags-count",
    (flags ?? []).length >= 35,
    `total=${flags?.length} enabled=${enabled.length}`,
  );

  const experimentalOn = enabled.filter(
    (f) => f.name.startsWith("streaming_") || f.name.startsWith("runtime_") || f.name.startsWith("performance_"),
  );
  log(
    "B3-flags-safe-defaults",
    experimentalOn.length === 0,
    experimentalOn.length === 0 ? "aucun flag expérimental ON" : `ON: ${experimentalOn.map((f) => f.name).join(",")}`,
  );

  const mvpEnabled = ["rights_management", "search_multi_type", "tips_enabled"];
  const enabledNames = enabled.map((f) => f.name).sort();
  log(
    "B3-flags-mvp-only",
    enabled.length === 3 && mvpEnabled.every((n) => enabledNames.includes(n)),
    `enabled=[${enabledNames.join(",")}]`,
  );
}

async function main() {
  console.log("=== Vague B Stabilisation — checks statiques ===\n");
  staticChecks();
  console.log("\n=== Vague B Stabilisation — checks live ===\n");
  await liveChecks();

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague B Stabilisation`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
