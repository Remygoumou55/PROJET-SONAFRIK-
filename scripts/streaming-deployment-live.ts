/**
 * SONAFRIK Sprint 1.3-A — Streaming Deployment Live Validation
 * Usage: npx tsx scripts/streaming-deployment-live.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createStreamingService } from "@sonafrik/api/streaming";
import { createAnalyticsService } from "@sonafrik/api/analytics";

const envPath = resolve(__dirname, "../apps/web/.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "cxjpburiiazzvlczzupy";

/** Morceau publié certifié Sprint 1.2-B */
const CERTIFIED_TRACK_ID = "411f4e81-b684-4691-983d-234eb127c82b";
const S12B_CREATOR_EMAIL = "s12b-artist-1-1782222972289@sonafrik.test";
const S12B_PASSWORD = "Sprint12BTest2026!";
const LISTENER_PASSWORD = "S13ALive2026!";

type Step = { phase: string; ok: boolean; detail: string };
const steps: Step[] = [];
const log = (phase: string, ok: boolean, detail: string) => {
  steps.push({ phase, ok, detail });
  console.log(`${ok ? "✅" : "❌"} [${phase}] ${detail}`);
};

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

async function signIn(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(error?.message ?? "signIn failed");
  return client;
}

async function probeFn(name: string, token?: string): Promise<number> {
  const res = await fetch(`${URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      apikey: ANON,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: "{}",
  });
  return res.status;
}

async function main() {
  console.log("=== Sprint 1.3-A Streaming Deployment Live ===\n");
  log("B-project-ref", URL.includes(PROJECT_REF), `ref=${PROJECT_REF}`);

  for (const fn of ["stream-start", "stream-progress", "stream-complete"]) {
    const status = await probeFn(fn);
    log(`D-http-${fn}`, status !== 404, `HTTP ${status}${status === 404 ? " NOT_DEPLOYED" : ""}`);
  }

  const catalogStatus = await probeFn("catalog-asset-signed-url");
  log("D-http-catalog", catalogStatus !== 404, `HTTP ${catalogStatus}`);

  const { data: track } = await admin
    .from("tracks")
    .select("id, title, creator_id, duration_seconds")
    .eq("id", CERTIFIED_TRACK_ID)
    .maybeSingle();
  log("G-track", !!track?.id, track ? `${track.title} (${track.duration_seconds}s)` : "missing");

  const listenerEmail = `s13a-listener-${Date.now()}@sonafrik.test`;
  const { data: created } = await admin.auth.admin.createUser({
    email: listenerEmail,
    password: LISTENER_PASSWORD,
    email_confirm: true,
  });
  await admin.from("profiles").upsert({
    id: created!.user!.id,
    full_name: "S13A Listener",
    account_type: "auditeur",
    onboarding_completed: true,
  });
  const listener = await signIn(listenerEmail, LISTENER_PASSWORD);
  const streaming = createStreamingService(listener);

  const { data: sessBefore } = await listener
    .from("stream_sessions")
    .select("id")
    .eq("track_id", CERTIFIED_TRACK_ID);
  const beforeCount = sessBefore?.length ?? 0;

  let sessionId = "";
  let duration = 0;
  try {
    const start = await streaming.startStream({
      trackId: CERTIFIED_TRACK_ID,
      platform: "web",
      qualityKbps: 128,
    });
    sessionId = start.sessionId;
    duration = start.durationSeconds;
    log("E-rpc-start", !!sessionId && !!start.signedUrl, `sessionId=${sessionId.slice(0, 8)}…`);
    log("F-player-play", !!start.signedUrl, "signedUrl received");
  } catch (e) {
    log("E-rpc-start", false, e instanceof Error ? e.message : String(e));
    log("F-player-play", false, "startStream failed");
  }

  if (sessionId) {
    try {
      await streaming.sendHeartbeat({ sessionId, positionSeconds: 15 });
      log("E-rpc-progress", true, "heartbeat position=15");
    } catch (e) {
      log("E-rpc-progress", false, e instanceof Error ? e.message : String(e));
    }

    const effectiveDuration = duration > 0 ? duration : 120;
    const completePos = Math.ceil(effectiveDuration * 0.95);
    try {
      const isValid = await streaming.completeStream({
        sessionId,
        positionSeconds: completePos,
        totalDurationSeconds: effectiveDuration,
      });
      log("E-rpc-complete", true, `isValidListen=${isValid}`);
    } catch (e) {
      log("E-rpc-complete", false, e instanceof Error ? e.message : String(e));
    }
  }

  const { data: sessAfter } = await listener
    .from("stream_sessions")
    .select("id, is_valid_listen, listen_percentage, completed_at")
    .eq("track_id", CERTIFIED_TRACK_ID)
    .order("started_at", { ascending: false });
  const afterCount = sessAfter?.length ?? 0;
  const newSessions = afterCount - beforeCount;
  log("G-session", newSessions >= 1, `new_sessions=${newSessions} total=${afterCount}`);

  if (sessAfter?.[0]) {
    const s = sessAfter[0];
    log(
      "G-session-data",
      !!s.completed_at,
      `valid=${s.is_valid_listen} pct=${s.listen_percentage}`,
    );
  }

  try {
    const creator = await signIn(S12B_CREATOR_EMAIL, S12B_PASSWORD);
    const stats = await createAnalyticsService(creator).getStreamStats({
      creatorId: track!.creator_id,
    });
    log(
      "H-analytics",
      stats.total_streams >= 1,
      `total=${stats.total_streams} valid=${stats.valid_streams}`,
    );
    const top = await createAnalyticsService(creator).getTopTracks({
      creatorId: track!.creator_id,
      limit: 5,
    });
    log("H-top-tracks", top.length >= 1, `tracks=${top.length}`);
  } catch (e) {
    log("H-analytics", false, e instanceof Error ? e.message : String(e));
  }

  const passed = steps.filter((s) => s.ok).length;
  const total = steps.length;
  const pct = Math.round((passed / total) * 100);
  console.log(`\n=== RÉSULTAT: ${passed}/${total} (${pct}%) ===`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
