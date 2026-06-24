/**
 * Certification Vague B++ — types, pagination, fusion favorites→social, navigation.
 * Usage: npx tsx scripts/probe-vague-b.ts
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(__dirname, "..");
const envPath = resolve(ROOT, "apps/web/.env.local");

type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];
const log = (name: string, ok: boolean, detail: string) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
};

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function countAsNever(dir: string): number {
  let total = 0;
  for (const file of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, file.name);
    if (file.isDirectory()) total += countAsNever(p);
    else if (file.name.endsWith(".ts") && !file.name.endsWith(".d.ts")) {
      total += (readFileSync(p, "utf8").match(/as never/g) ?? []).length;
    }
  }
  return total;
}

function loadEnv() {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
  }
}

function staticChecks() {
  const dbTypes = read("packages/database/src/types/index.ts");
  const bom = dbTypes.charCodeAt(0) === 0xfeff;
  log("B1 types UTF-8 sans BOM", !bom && dbTypes.startsWith("export type Json"), "fichier lisible TypeScript");
  log(
    "B1 RPC notifications",
    dbTypes.includes("count_unread_notifications: { Args: never; Returns: number }") &&
      dbTypes.includes("mark_all_notifications_read: { Args: never; Returns: number }"),
    "signatures unifiées",
  );
  log("B1 tables wallet", dbTypes.includes("withdrawals: {") && dbTypes.includes("wallets: {"), "tables financières");

  const asNeverCount = countAsNever(resolve(ROOT, "packages/api/src"));
  log(
    "B2 as never réduit",
    asNeverCount <= 75,
    `${asNeverCount} occurrences (baseline ~108, cible ≤75)`,
  );

  for (const [label, rel] of [
    ["wallet", "packages/api/src/wallet/wallet.repository.ts"],
    ["social", "packages/api/src/social/social.repository.ts"],
    ["recommendation", "packages/api/src/recommendation/recommendation.repository.ts"],
    ["discovery", "packages/api/src/discovery/discovery.repository.ts"],
  ] as const) {
    const src = read(rel);
    log(`B2 ${label}.repository sans as never`, !src.includes("as never"), rel);
  }

  const streamingRepo = read("packages/api/src/streaming/streaming.repository.ts");
  log(
    "B7 favorites fusion streaming.repo",
    !streamingRepo.includes("toggleFavorite") && !streamingRepo.includes("getUserFavorites"),
    "favoris retirés du repo streaming",
  );

  const streamingService = read("packages/api/src/streaming/streaming.service.ts");
  log(
    "B7 favorites délégués social",
    streamingService.includes("createSocialService") &&
      streamingService.includes("this.social.toggleFavorite"),
    "source unique @sonafrik/api/social",
  );

  const catalogRepo = read("packages/api/src/catalog/catalog.repository.ts");
  const walletRepo = read("packages/api/src/wallet/wallet.repository.ts");
  const socialRepo = read("packages/api/src/social/social.repository.ts");
  log(
    "B3 pagination repos MVP",
    catalogRepo.includes(".range(offset, offset + limit - 1)") &&
      walletRepo.includes("getWithdrawals(userId: string, limit = 50") &&
      socialRepo.includes("getUserFavorites(userId: string, limit ="),
    "catalog, wallet, social",
  );

  log(
    "B3 streaming analytics cap",
    streamingRepo.includes(".limit(10_000)"),
    "stream_sessions plafonnées",
  );

  const streamingSchemas = read("packages/api/src/streaming/schemas.ts");
  log(
    "B6 toggleFavoriteSchema unique",
    streamingSchemas.includes('export { toggleFavoriteSchema } from "../social/schemas"') &&
      !streamingSchemas.includes("entityType: z.enum([\"track\", \"album\""),
    "réexport social",
  );

  const searchResults = read("apps/web/src/features/listener/components/SearchResults.tsx");
  const searchRows = read("apps/web/src/features/listener/components/SearchResultRows.tsx");
  const beatStore = read("apps/web/src/features/marketplace/components/BeatStoreClient.tsx");
  const hasPlaylistLink =
    searchResults.includes("/library/playlist/${playlist.id}") ||
    searchRows.includes("/library/playlist/${playlist.id}");
  const hasBeatLink =
    searchResults.includes("/listen/beats?beat=${beat.id}") ||
    searchRows.includes("/listen/beats?beat=${beat.id}");
  log(
    "B4 navigation recherche + beats",
    hasPlaylistLink && hasBeatLink && beatStore.includes("highlightBeatId"),
    "deep links fonctionnels",
  );

  log("B5 gen-types script", existsSync(resolve(ROOT, "scripts/gen-types.ts")), "scripts/gen-types.ts");
  log("B5 probe vague A", existsSync(resolve(ROOT, "scripts/probe-vague-a.ts")), "régression A");
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
  const { error: signInErr } = await client.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });
  if (signInErr) {
    log("live auth", false, signInErr.message);
    return;
  }

  const { data: trending, error: trendErr } = await client.rpc("get_trending_tracks", {
    p_window: "7d",
    p_limit: 3,
  });
  log(
    "B8 live get_trending_tracks",
    !trendErr && (Array.isArray(trending) || trending === null),
    trendErr?.message ?? `rows=${Array.isArray(trending) ? trending.length : 0}`,
  );

  const { data: feed, error: feedErr } = await client.rpc("get_discovery_feed", { p_limit: 3 });
  log(
    "B8 live get_discovery_feed",
    !feedErr,
    feedErr?.message ?? "ok",
  );

  const { error: favErr } = await client.rpc("toggle_favorite", {
    p_entity_type: "track",
    p_entity_id: "00000000-0000-0000-0000-000000000099",
  });
  log(
    "B7 live toggle_favorite RPC",
    !favErr || (favErr.message.includes("introuvable") || favErr.message.includes("not found") || favErr.code === "P0001"),
    favErr?.message ?? "ok",
  );
}

async function main() {
  console.log("=== Vague B++ — checks statiques ===\n");
  staticChecks();
  console.log("\n=== Vague B++ — checks live Supabase ===\n");
  await liveChecks();

  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks Vague B++`);
  process.exitCode = passed === checks.length ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
