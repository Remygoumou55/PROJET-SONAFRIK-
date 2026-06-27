/**
 * Récupère les IDs réels Supabase pour les liens de contrôle local.
 * Usage: node scripts/fetch-control-links.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY manquants dans apps/web/.env.local");
  process.exit(1);
}

const supabase = createClient(url, anonKey);
const BASE = "http://localhost:3000";

async function main() {
  const [artistsRes, albumsRes, playlistsRes, worksRes] = await Promise.all([
    supabase
      .from("artist_profiles")
      .select("creator_id, stage_name, slug")
      .eq("is_public", true)
      .not("stage_name", "is", null)
      .order("stage_name")
      .limit(8),
    supabase
      .from("albums")
      .select("id, title, creator_id, publication_status")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("playlists")
      .select("id, title, user_id, is_public")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("works")
      .select("id, title, creator_id")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (artistsRes.error) console.error("artist_profiles:", artistsRes.error.message);
  if (albumsRes.error) console.error("albums:", albumsRes.error.message);
  if (playlistsRes.error) console.error("playlists:", playlistsRes.error.message);
  if (worksRes.error) console.error("works:", worksRes.error.message);

  const artists = artistsRes.data ?? [];
  const albums = albumsRes.data ?? [];
  const playlists = playlistsRes.data ?? [];
  const works = worksRes.data ?? [];

  const pick = (arr) => arr[0] ?? null;

  const artist = pick(artists);
  const album = pick(albums.filter((a) => a.publication_status === "published")) ?? pick(albums);
  const playlist = pick(playlists);
  const work = pick(works);

  console.log("\n=== LIENS DE CONTRÔLE — localhost:3000 ===\n");

  if (artist) {
    console.log(`Artiste (${artist.stage_name})`);
    console.log(`${BASE}/listen/artist/${artist.creator_id}\n`);
  } else {
    console.log("Artiste: aucun profil public trouvé\n");
  }

  if (album) {
    console.log(`Album (${album.title ?? "sans titre"})`);
    console.log(`${BASE}/listen/album/${album.id}\n`);
  } else {
    console.log("Album: aucun album trouvé\n");
  }

  if (playlist) {
    console.log(`Playlist (${playlist.title ?? "sans titre"})`);
    console.log(`${BASE}/library/playlist/${playlist.id}\n`);
  } else {
    console.log("Playlist: aucune playlist trouvée\n");
  }

  if (work) {
    console.log(`Œuvre / droits (${work.title ?? "sans titre"}) — route creator/rights/[workId]`);
    console.log(`${BASE}/creator/rights/${work.id}\n`);
  } else {
    console.log("Œuvre: aucune œuvre trouvée (route creator/rights nécessite un workId)\n");
  }

  console.log("--- Tous les artistes publics ---");
  for (const a of artists) {
    console.log(`  ${a.stage_name}: ${BASE}/listen/artist/${a.creator_id}`);
  }

  console.log("\n--- Albums récents ---");
  for (const a of albums) {
    console.log(`  ${a.title} [${a.publication_status ?? "?"}]: ${BASE}/listen/album/${a.id}`);
  }

  console.log("\n--- Playlists récentes ---");
  for (const p of playlists) {
    console.log(`  ${p.title}: ${BASE}/library/playlist/${p.id}`);
  }

  console.log("\n--- Œuvres (creator/rights — workId, PAS contractId) ---");
  for (const w of works) {
    console.log(`  ${w.title}: ${BASE}/creator/rights/${w.id}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
