/**
 * Upload un MP3 réel sur un morceau publié (remplace l'audio + met à jour le titre).
 * Usage: npx tsx scripts/upload-real-track.ts [chemin-vers-fichier.mp3]
 */
import { readFileSync, existsSync } from "fs";
import { resolve, basename } from "path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_MP3 =
  "c:\\Users\\remyg\\OneDrive\\Bureau\\Afro2Zbeat_-_DANEZIK Master_By_RMG_2023.mp3";

const TRACK_ID = "411f4e81-b684-4691-983d-234eb127c82b";
const TRACK_TITLE = "DANEZIK — Afro2Zbeat";
const TRACK_SLUG = "danezik-afro2zbeat-rmg";

const envPath = resolve(__dirname, "../apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function estimateMp3DurationSeconds(buffer: Buffer): number {
  let offset = 0;
  if (buffer.length >= 10 && buffer.toString("latin1", 0, 3) === "ID3") {
    const tagSize =
      ((buffer[6]! & 0x7f) << 21) |
      ((buffer[7]! & 0x7f) << 14) |
      ((buffer[8]! & 0x7f) << 7) |
      (buffer[9]! & 0x7f);
    offset = 10 + tagSize;
  }

  const bitratesKbps = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
  for (let i = offset; i < Math.min(buffer.length - 4, offset + 8192); i++) {
    if (buffer[i] !== 0xff || (buffer[i + 1]! & 0xe0) !== 0xe0) continue;
    const layer = (buffer[i + 1]! >> 1) & 0x03;
    const bitrateIdx = (buffer[i + 2]! >> 4) & 0x0f;
    if (layer !== 1 || bitrateIdx < 1 || bitrateIdx > 14) continue;
    const bitrate = bitratesKbps[bitrateIdx]! * 1000;
    return Math.max(1, Math.round((buffer.length * 8) / bitrate));
  }

  return Math.max(1, Math.round((buffer.length * 8) / 256000));
}

async function main() {
  const mp3Path = resolve(process.argv[2] ?? DEFAULT_MP3);
  if (!existsSync(mp3Path)) {
    console.error(`❌ Fichier introuvable : ${mp3Path}`);
    process.exit(1);
  }

  const mp3 = readFileSync(mp3Path);
  const durationSeconds = estimateMp3DurationSeconds(mp3);
  console.log(`📀 ${basename(mp3Path)} — ${(mp3.length / 1024 / 1024).toFixed(2)} Mo, ~${durationSeconds}s`);

  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

  const { data: track, error: trackErr } = await admin
    .from("tracks")
    .select("id, title, publication_status, creator_id")
    .eq("id", TRACK_ID)
    .maybeSingle();

  if (trackErr || !track) {
    console.error("❌ Morceau cible introuvable", trackErr?.message);
    process.exit(1);
  }

  const { data: fileRow, error: fileErr } = await admin
    .from("track_files")
    .select("id, file_path")
    .eq("track_id", TRACK_ID)
    .eq("is_primary", true)
    .maybeSingle();

  if (fileErr || !fileRow?.file_path) {
    console.error("❌ Fichier audio principal introuvable", fileErr?.message);
    process.exit(1);
  }

  const filePath = fileRow.file_path as string;
  console.log(`⬆️  Upload vers ${filePath}…`);

  const { error: upErr } = await admin.storage.from("catalog-audio").upload(filePath, mp3, {
    contentType: "audio/mpeg",
    upsert: true,
  });

  if (upErr) {
    console.error("❌ Upload storage échoué", upErr.message);
    process.exit(1);
  }

  const { error: tfErr } = await admin
    .from("track_files")
    .update({
      file_size_bytes: mp3.length,
      duration_seconds: durationSeconds,
      format: "mp3",
      bitrate_kbps: 320,
    })
    .eq("id", fileRow.id);

  if (tfErr) {
    console.error("❌ Mise à jour track_files échouée", tfErr.message);
    process.exit(1);
  }

  const { error: trErr } = await admin
    .from("tracks")
    .update({
      title: TRACK_TITLE,
      slug: TRACK_SLUG,
      duration_seconds: durationSeconds,
    })
    .eq("id", TRACK_ID);

  if (trErr) {
    console.error("❌ Mise à jour track échouée", trErr.message);
    process.exit(1);
  }

  console.log("\n✅ Morceau prêt pour la lecture !");
  console.log(`   Titre    : ${TRACK_TITLE}`);
  console.log(`   ID       : ${TRACK_ID}`);
  console.log(`   Statut   : ${track.publication_status}`);
  console.log(`   Durée    : ~${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, "0")}`);
  console.log(`\n   → http://localhost:3000/search — recherchez « DANEZIK »`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
