/**
 * SONAFRIK Sprint 1.3-C — Quality certification (API + streaming chain)
 * Usage: npx tsx scripts/sprint13c-quality-certification.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { createStreamingService } from "@sonafrik/api/streaming";
import { mapFunctionInvokeError } from "@sonafrik/api/streaming";

const envPath = resolve(__dirname, "../apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TRACK = "411f4e81-b684-4691-983d-234eb127c82b";
const PASS = "S13CQuality2026!";

const steps: { id: string; ok: boolean; detail: string }[] = [];
const log = (id: string, ok: boolean, detail: string) => {
  steps.push({ id, ok, detail });
  console.log(`${ok ? "✅" : "❌"} [${id}] ${detail}`);
};

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

async function createListener(suffix: string) {
  const email = `s13c-${suffix}-${Date.now()}@sonafrik.test`;
  const { data } = await admin.auth.admin.createUser({ email, password: PASS, email_confirm: true });
  await admin.from("profiles").upsert({
    id: data!.user!.id,
    full_name: `S13C ${suffix}`,
    account_type: "auditeur",
    onboarding_completed: true,
  });
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  await client.auth.signInWithPassword({ email, password: PASS });
  return client;
}

async function main() {
  console.log("=== Sprint 1.3-C Quality Certification ===\n");

  for (const fn of ["stream-start", "stream-progress", "stream-complete"]) {
    const res = await fetch(`${URL}/functions/v1/${fn}`, {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: "{}",
    });
    log(`infra-${fn}`, res.status !== 404, `HTTP ${res.status}`);
  }

  const client = await createListener("main");
  const streaming = createStreamingService(client);
  const start = await streaming.startStream({ trackId: TRACK, platform: "web" });
  const dur = start.durationSeconds > 0 ? start.durationSeconds : 120;
  await streaming.sendHeartbeat({ sessionId: start.sessionId, positionSeconds: 12 });

  const { data: sess } = await client.auth.getSession();
  const raw = await fetch(`${URL}/functions/v1/stream-complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sess.session!.access_token}`,
      apikey: ANON,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId: start.sessionId,
      positionSeconds: Math.ceil(dur * 0.95),
      totalDurationSeconds: dur,
    }),
  });
  const rawBody = await raw.text();
  log("B1-stream-complete-http", raw.status === 200, `status=${raw.status} body=${rawBody.slice(0, 80)}`);

  const invokeValid = await streaming.completeStream({
    sessionId: start.sessionId,
    positionSeconds: Math.ceil(dur * 0.95),
    totalDurationSeconds: dur,
  });
  log("B1-invoke-idempotent", invokeValid === true, `isValidListen=${invokeValid}`);

  const mapped = mapFunctionInvokeError("complete", { name: "FunctionsHttpError", message: "stream_complete_failed" });
  log("B2-error-mapping", mapped === "stream_complete_failed", `mapped=${mapped}`);

  const fraudClient = await createListener("fraud");
  const fraudStreaming = createStreamingService(fraudClient);
  const fraudStart = await fraudStreaming.startStream({ trackId: TRACK, platform: "web" });
  const { data: fsess } = await fraudClient.auth.getSession();
  const prog = await fetch(`${URL}/functions/v1/stream-progress`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${fsess.session!.access_token}`,
      apikey: ANON,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId: fraudStart.sessionId, positionSeconds: 500 }),
  });
  const progJson = (await prog.json()) as { fraudFlags?: string[] };
  const { data: fraudRow } = await fraudClient
    .from("stream_sessions")
    .select("fraud_flags")
    .eq("id", fraudStart.sessionId)
    .maybeSingle();
  const dbFlags = (fraudRow?.fraud_flags as string[]) ?? [];
  log(
    "B3-fraud-flags",
    progJson.fraudFlags?.includes("fast_forward_detected") && dbFlags.includes("fast_forward_detected"),
    `api=${progJson.fraudFlags?.join(",")} db=${dbFlags.join(",")}`,
  );

  await fraudStreaming.startStream({ trackId: TRACK, platform: "web" });
  await fraudStreaming.startStream({ trackId: TRACK, platform: "web" });
  const { data: orphanSessions } = await fraudClient
    .from("stream_sessions")
    .select("fraud_flags, completed_at")
    .eq("track_id", TRACK)
    .order("started_at", { ascending: false })
    .limit(5);
  const orphaned = orphanSessions?.some(
    (s) =>
      s.fraud_flags?.includes("orphaned_session") ||
      s.fraud_flags?.includes("multi_session_start"),
  ) ?? false;
  log("B3-multi-session", orphaned, `multi_session=${orphaned}`);

  const passed = steps.filter((s) => s.ok).length;
  console.log(`\n=== ${passed}/${steps.length} ===`);
  process.exit(passed === steps.length ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
