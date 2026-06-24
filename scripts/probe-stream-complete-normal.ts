import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { createStreamingService } from "../packages/api/src/streaming";

const envPath = resolve(__dirname, "../apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
}

const TRACK = "411f4e81-b684-4691-983d-234eb127c82b";

async function main() {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  await client.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });
  const streaming = createStreamingService(client);

  const start = await streaming.startStream({ trackId: TRACK, platform: "web" });
  console.log("session", start.sessionId, "dur", start.durationSeconds);

  const ok = await streaming.completeStream({
    sessionId: start.sessionId,
    positionSeconds: 3,
    totalDurationSeconds: 3,
  });
  console.log("complete ok", ok);

  const ok2 = await streaming.completeStream({
    sessionId: start.sessionId,
    positionSeconds: 3,
    totalDurationSeconds: 3,
  });
  console.log("retry ok", ok2);
}

main().catch(console.error);
