import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { createStreamingService } from "../packages/api/src/streaming";

const envPath = resolve(__dirname, "../apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TRACK = "bfe90571-e5cf-49a5-ba0e-ca213381ef68";

async function main() {
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  await client.auth.signInWithPassword({
    email: "s13b-playwright-listener@sonafrik.test",
    password: "S13BCert2026!",
  });
  const streaming = createStreamingService(client);

  const start = await streaming.startStream({ trackId: TRACK, platform: "web", qualityKbps: 96 });
  const sessionA = start.sessionId;
  console.log("session A", sessionA);

  const start2 = await streaming.startStream({ trackId: TRACK, platform: "web", qualityKbps: 96 });
  console.log("session B (closes A)", start2.sessionId);

  try {
    const ok = await streaming.completeStream({
      sessionId: sessionA,
      positionSeconds: 3,
      totalDurationSeconds: 3,
    });
    console.log("complete A after B started", ok);
  } catch (e) {
    console.error("complete A FAIL", e);
  }
}

main().catch(console.error);
