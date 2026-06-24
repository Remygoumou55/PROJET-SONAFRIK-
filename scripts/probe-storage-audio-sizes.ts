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
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

async function main() {
  const { data: files } = await admin
    .from("track_files")
    .select("track_id, format, file_path, file_size_bytes, tracks!inner(title)")
    .ilike("tracks.title", "S12B Track%")
    .eq("is_primary", true)
    .limit(20);

  console.log("DB records:", files);

  for (const f of files ?? []) {
    const { data: signed, error } = await admin.storage
      .from("catalog-audio")
      .createSignedUrl(f.file_path, 300);
    if (error || !signed?.signedUrl) {
      console.log(f.tracks, "SIGN ERR", error?.message);
      continue;
    }
    const res = await fetch(signed.signedUrl);
    const buf = Buffer.from(await res.arrayBuffer());
    console.log(
      (f as { tracks?: { title?: string } }).tracks?.title,
      "db_size=",
      f.file_size_bytes,
      "actual=",
      buf.length,
      "magic=",
      buf.slice(0, 8).toString("hex"),
    );
  }
}

main().catch(console.error);
