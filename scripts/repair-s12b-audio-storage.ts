/**
 * Répare les fichiers audio S12B (stubs 4 octets → MP3 valide jouable).
 * Usage: npx tsx scripts/repair-s12b-audio-storage.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** MP3 valide jouable navigateur (~3s, samplelib) */
async function loadPlayableMp3(): Promise<Buffer> {
  const res = await fetch("https://download.samplelib.com/mp3/sample-3s.mp3");
  if (!res.ok) throw new Error(`Impossible de télécharger sample MP3 : ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
  const miniMp3 = await loadPlayableMp3();
  console.log(`MP3 de réparation : ${miniMp3.length} octets`);

  const { data: rows, error } = await admin
    .from("track_files")
    .select("id, file_path, track_id, tracks!inner(title)")
    .ilike("tracks.title", "S12B Track%")
    .eq("is_primary", true);

  if (error) throw error;
  if (!rows?.length) {
    console.log("Aucun fichier S12B trouvé.");
    return;
  }

  const paths = [...new Set(rows.map((r) => r.file_path as string))];
  console.log(`${paths.length} chemins uniques à réparer…`);

  let ok = 0;
  let fail = 0;

  for (const filePath of paths) {
    const { error: upErr } = await admin.storage
      .from("catalog-audio")
      .upload(filePath, miniMp3, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (upErr) {
      console.error(`❌ ${filePath} — ${upErr.message}`);
      fail++;
      continue;
    }

    const { error: dbErr } = await admin
      .from("track_files")
      .update({ file_size_bytes: miniMp3.length, format: "mp3" })
      .eq("file_path", filePath);

    if (dbErr) {
      console.error(`⚠️  ${filePath} upload OK mais DB : ${dbErr.message}`);
    } else {
      console.log(`✅ ${filePath}`);
      ok++;
    }
  }

  console.log(`\nTerminé : ${ok} réparés, ${fail} échecs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
