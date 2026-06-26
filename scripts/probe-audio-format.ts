import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const client = createClient(URL, ANON, { auth: { persistSession: false } });

async function main() {
  const { data: signIn } = await client.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });
  const token = signIn.session?.access_token;
  if (!token) throw new Error("no session");

  const { data: tracks } = await admin
    .from("tracks")
    .select("id, title")
    .ilike("title", "S12B Track%")
    .limit(5);

  for (const t of tracks ?? []) {
    const { data: files } = await admin
      .from("track_files")
      .select("format, bitrate_kbps, file_path, is_primary")
      .eq("track_id", t.id);
    console.log(`\n${t.title} (${t.id})`);
    console.log(files);
  }

  const trackIds = [
    "bfe90571-e5cf-49a5-ba0e-ca213381ef68",
    "411f4e81-b684-4691-983d-234eb127c82b",
    tracks?.[0]?.id,
  ].filter(Boolean) as string[];

  for (const trackId of [...new Set(trackIds)]) {
    const res = await fetch(`${URL}/functions/v1/stream-start`, {
      method: "POST",
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trackId, platform: "web" }),
    });
    const body = await res.json();
    console.log(`\nstream-start track=${trackId}`, res.status, {
      sessionId: body.sessionId,
      url: body.signedUrl?.slice(0, 80),
    });
    if (body.signedUrl) {
      const head = await fetch(body.signedUrl, { method: "HEAD" });
      console.log("HEAD", head.status, head.headers.get("content-type"));
      const get = await fetch(body.signedUrl, { headers: { Range: "bytes=0-31" } });
      const buf = Buffer.from(await get.arrayBuffer());
      console.log("bytes", buf.toString("hex"));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
