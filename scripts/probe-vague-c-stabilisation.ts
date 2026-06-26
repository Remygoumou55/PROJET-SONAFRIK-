/**
 * Re-audit Vague C — Nettoyage (audit forensique juin 2026).
 * Usage: pnpm probe:vague-c-stabilisation
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join, relative } from "path";
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

function walkFiles(dir: string, ext: RegExp, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(p, ext, acc);
    else if (ext.test(entry.name)) acc.push(p);
  }
  return acc;
}

function staticChecks() {
  const repo = read("packages/api/src/social/social.repository.ts");
  const toggleLikeBlock = repo.match(/async toggleLike[\s\S]*?async toggleFavorite/)?.[0] ?? "";
  log(
    "C1-like-rpc-separation",
    toggleLikeBlock.includes('rpc("toggle_like"') && !toggleLikeBlock.includes("toggle_favorite"),
    "toggleLike → toggle_like RPC",
  );

  log(
    "C1-migration-likes",
    existsSync(resolve(ROOT, "supabase/migrations/20260624160000_vague_c_likes_separation.sql")),
    "migration likes présente",
  );

  log(
    "C1-discovery-likes-source",
    existsSync(resolve(ROOT, "supabase/migrations/20260624170000_vague_c_discovery_likes_source.sql")),
    "discovery/analytics → table likes",
  );

  const dbTypes = read("packages/database/src/types/index.ts");
  log(
    "C1-types-likes",
    dbTypes.includes("likes: {") && dbTypes.includes("toggle_like:"),
    "types DB likes + toggle_like",
  );

  const likeButton = read("apps/web/src/features/social/components/LikeButton.tsx");
  log(
    "C1-like-button-labels",
    likeButton.includes("Aimer ce morceau") && !likeButton.includes("favoris"),
    "LikeButton ≠ favoris (a11y)",
  );

  log(
    "C1-social-test",
    existsSync(resolve(ROOT, "packages/api/src/social/social.repository.test.ts")),
    "test séparation RPC",
  );

  const searchService = read("packages/api/src/streaming/streaming.service.ts");
  const searchSchema = read("packages/api/src/streaming/schemas.ts");
  log(
    "C3-search-beats-gated",
    searchSchema.includes("includeBeats") &&
      searchService.includes("includeBeats") &&
      read("apps/web/src/app/(listener)/search/page.tsx").includes("beat_store") &&
      read("apps/web/src/features/listener/components/SearchPage.tsx").includes("beatStoreEnabled"),
    "recherche beats derrière flag beat_store",
  );

  const beatsPage = read("apps/web/src/app/(listener)/listen/beats/page.tsx");
  log(
    "C3-beats-page-flag",
    beatsPage.includes('isFeatureEnabled("beat_store")') && beatsPage.includes("ComingSoon"),
    "page /listen/beats → ComingSoon si flag OFF",
  );

  log(
    "C2-hex-probe-script",
    existsSync(resolve(ROOT, "scripts/probe-hex-colors.ts")),
    "probe hex Global SCS",
  );

  const mobileHex = walkFiles(resolve(ROOT, "apps/mobile"), /\.(tsx|ts)$/);
  const mobileViolations: string[] = [];
  const HEX = /#[0-9a-fA-F]{3,8}\b/g;
  for (const abs of mobileHex) {
    const rel = relative(ROOT, abs).replace(/\\/g, "/");
    const matches = readFileSync(abs, "utf8").match(HEX) ?? [];
    if (matches.length > 0) mobileViolations.push(rel);
  }
  log(
    "C2-mobile-zero-hex",
    mobileViolations.length === 0,
    mobileViolations.length ? mobileViolations.join(", ") : "0 hex mobile",
  );

  log(
    "C4-rate-limit-fn",
    read("supabase/migrations/20260617030000_rate_limits.sql").includes("check_rate_limit"),
    "check_rate_limit en migration",
  );

  log(
    "C4-orphan-tables-doc",
    existsSync(resolve(ROOT, "docs/VAGUE_C_ORPHAN_TABLES.md")),
    "audit permissions/rate_limits documenté",
  );

  log(
    "C-doc-vague-c",
    existsSync(resolve(ROOT, "docs/VAGUE_C_STABILISATION.md")),
    "VAGUE_C_STABILISATION.md",
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
  const { error: signInErr } = await anon.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });
  if (signInErr) {
    log("C1-live-auth", false, signInErr.message);
    return;
  }

  const { error: likeErr } = await anon.rpc("toggle_like", {
    p_track_id: "00000000-0000-0000-0000-000000000099",
  });
  log(
    "C1-live-toggle_like",
    !!likeErr &&
      (likeErr.message.includes("foreign key") ||
        likeErr.message.includes("violates") ||
        likeErr.code === "23503"),
    likeErr?.message ?? "RPC absent",
  );

  const { data: beatFlag } = await anon
    .from("feature_flags")
    .select("enabled")
    .eq("name", "beat_store")
    .maybeSingle();
  log(
    "C3-live-beat-store-off",
    beatFlag?.enabled === false,
    `beat_store=${beatFlag?.enabled ?? "?"}`,
  );

  const { data: tables } = await anon.rpc("get_launch_progress");
  void tables;
  const { count: permCount } = await anon.from("permissions").select("*", { count: "exact", head: true });
  log(
    "C4-live-permissions-rls",
    permCount !== null,
    `permissions lisible (count=${permCount ?? "blocked"})`,
  );
}

async function main() {
  console.log("=== Vague C Stabilisation — checks statiques ===\n");
  staticChecks();
  console.log("\n=== Vague C Stabilisation — checks live ===\n");
  await liveChecks();

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague C Stabilisation`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
