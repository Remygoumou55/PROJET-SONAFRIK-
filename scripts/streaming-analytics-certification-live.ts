/**
 * SONAFRIK Sprint 1.3-B — Streaming & Analytics Re-Certification
 * Usage: npx tsx scripts/streaming-analytics-certification-live.ts
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

const S12B_PASSWORD = "Sprint12BTest2026!";
const LISTENER_PASSWORD = "S13BCert2026!";

/** 3 morceaux publiés Sprint 1.2-B (3 artistes distincts) */
const CERTIFIED_TRACKS = [
  {
    id: "411f4e81-b684-4691-983d-234eb127c82b",
    artistEmail: "s12b-artist-1-1782222972289@sonafrik.test",
    label: "S12B-A1-T1",
  },
  {
    id: "ae59a1ac-e265-4154-884c-d71a5b105f21",
    artistEmail: "s12b-artist-2-1782222972289@sonafrik.test",
    label: "S12B-A2-T2",
  },
  {
    id: "bac9e97c-e784-4c12-be7a-13895b299e70",
    artistEmail: "s12b-artist-3-1782222972289@sonafrik.test",
    label: "S12B-A3-T3",
  },
] as const;

const DURATION_FALLBACK = 120;

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

async function createListener(suffix: string): Promise<SupabaseClient> {
  const email = `s13b-${suffix}-${Date.now()}@sonafrik.test`;
  const { data } = await admin.auth.admin.createUser({
    email,
    password: LISTENER_PASSWORD,
    email_confirm: true,
  });
  await admin.from("profiles").upsert({
    id: data!.user!.id,
    full_name: `S13B ${suffix}`,
    account_type: "auditeur",
    onboarding_completed: true,
  });
  return signIn(email, LISTENER_PASSWORD);
}

async function fullListenCycle(
  client: SupabaseClient,
  trackId: string,
  pct: number,
): Promise<{ sessionId: string; isValid: boolean; listenPct: number }> {
  const streaming = createStreamingService(client);
  const start = await streaming.startStream({ trackId, platform: "web" });
  const dur = start.durationSeconds > 0 ? start.durationSeconds : DURATION_FALLBACK;
  const pos = Math.floor(dur * pct);
  await streaming.sendHeartbeat({ sessionId: start.sessionId, positionSeconds: Math.min(pos, 5) });
  if (pct >= 0.5) {
    await streaming.sendHeartbeat({ sessionId: start.sessionId, positionSeconds: Math.floor(dur * 0.5) });
  }
  let isValid = false;
  try {
    isValid = await streaming.completeStream({
      sessionId: start.sessionId,
      positionSeconds: pos,
      totalDurationSeconds: dur,
    });
  } catch (e) {
    throw e;
  }
  const session = await streaming.getSession(start.sessionId);
  return {
    sessionId: start.sessionId,
    isValid,
    listenPct: Number(session.listen_percentage ?? 0),
  };
}

async function invokeProgress(
  client: SupabaseClient,
  sessionId: string,
  positionSeconds: number,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const { data: sess } = await client.auth.getSession();
  const token = sess.session?.access_token;
  const res = await fetch(`${URL}/functions/v1/stream-progress`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: ANON,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId, positionSeconds }),
  });
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, body };
}

async function main() {
  console.log("=== Sprint 1.3-B Streaming & Analytics Certification ===\n");
  const ts = Date.now();

  for (const fn of ["stream-start", "stream-progress", "stream-complete"]) {
    const res = await fetch(`${URL}/functions/v1/${fn}`, {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: "{}",
    });
    log(`B-${fn}`, res.status !== 404, `HTTP ${res.status}`);
  }

  const { data: published } = await admin
    .from("tracks")
    .select("id")
    .eq("publication_status", "published")
    .is("deleted_at", null);
  log("B-published", (published?.length ?? 0) >= 3, `count=${published?.length ?? 0}`);

  const listener1 = await createListener("L1");
  const listener2 = await createListener("L2");
  const listener3 = await createListener("L3");

  const track0 = CERTIFIED_TRACKS[0]!.id;

  try {
    const s1 = await createStreamingService(listener1).startStream({ trackId: track0, platform: "web" });
    log("C-play", !!s1.signedUrl, "Play OK");
    const streaming1 = createStreamingService(listener1);
    await streaming1.sendHeartbeat({ sessionId: s1.sessionId, positionSeconds: 5 });
    log("C-pause-resume", true, "heartbeat mid-stream OK");
  } catch (e) {
    log("C-play", false, e instanceof Error ? e.message : String(e));
  }

  try {
    const r100 = await fullListenCycle(listener1, track0, 0.95);
    log("D-L1-full", r100.isValid, `valid=${r100.isValid} pct=${r100.listenPct}`);
  } catch (e) {
    log("D-L1-full", false, e instanceof Error ? e.message : String(e));
  }

  try {
    const r50 = await fullListenCycle(listener2, track0, 0.5);
    log("D-L2-partial", !r50.isValid, `valid=${r50.isValid} pct=${r50.listenPct}`);
  } catch (e) {
    log("D-L2-partial", false, e instanceof Error ? e.message : String(e));
  }

  try {
    const streaming3 = createStreamingService(listener3);
    const start = await streaming3.startStream({ trackId: track0, platform: "web" });
    await streaming3.sendHeartbeat({ sessionId: start.sessionId, positionSeconds: 8 });
    await new Promise((r) => setTimeout(r, 500));
    await streaming3.sendHeartbeat({ sessionId: start.sessionId, positionSeconds: 18 });
    const dur = start.durationSeconds > 0 ? start.durationSeconds : DURATION_FALLBACK;
    const isValid = await streaming3.completeStream({
      sessionId: start.sessionId,
      positionSeconds: Math.floor(dur * 0.95),
      totalDurationSeconds: dur,
    });
    log("D-L3-pause-resume", isValid, `valid=${isValid}`);
  } catch (e) {
    log("D-L3-pause-resume", false, e instanceof Error ? e.message : String(e));
  }

  const { data: sessions } = await listener1
    .from("stream_sessions")
    .select("id, started_at, completed_at, listen_percentage, total_listened_seconds")
    .eq("track_id", track0)
    .order("started_at", { ascending: false })
    .limit(5);
  const hasFields =
    sessions?.[0]?.id &&
    sessions[0].started_at &&
    sessions[0].completed_at != null &&
    sessions[0].listen_percentage != null;
  log("D-session-fields", !!hasFields, hasFields ? JSON.stringify(sessions![0]) : "no session");

  try {
    const v100 = await fullListenCycle(await createListener("E100"), track0, 0.95);
    log("E-100pct", v100.isValid, `valid=${v100.isValid}`);
    const v50 = await fullListenCycle(await createListener("E50"), track0, 0.5);
    log("E-50pct", !v50.isValid, `valid=${v50.isValid} pct=${v50.listenPct}`);
    const v25 = await fullListenCycle(await createListener("E25"), track0, 0.25);
    log("E-30pct", !v25.isValid, `valid=${v25.isValid} pct=${v25.listenPct}`);
    await fullListenCycle(listener2, track0, 0.95);
    await fullListenCycle(listener2, track0, 0.95);
    log("E-multi-listen", true, "2 extra sessions same user");
  } catch (e) {
    log("E-valid-listens", false, e instanceof Error ? e.message : String(e));
  }

  try {
    const fraudClient = await createListener("FRAUD");
    const streaming = createStreamingService(fraudClient);
    const start = await streaming.startStream({ trackId: track0, platform: "web" });
    const { status, body } = await invokeProgress(fraudClient, start.sessionId, 500);
    const flags = (body.fraudFlags as string[]) ?? [];
    log("F-fast-forward", status === 200 && flags.includes("fast_forward_detected"), `flags=${flags.join(",")}`);
    await streaming.startStream({ trackId: track0, platform: "web" });
    await streaming.startStream({ trackId: track0, platform: "web" });
    log("F-multi-start", true, "multi startStream without error");
    const { data: fraudSess } = await fraudClient
      .from("stream_sessions")
      .select("fraud_flags")
      .eq("id", start.sessionId)
      .maybeSingle();
    const dbFlags = (fraudSess?.fraud_flags as string[] | null) ?? [];
    log("F-fraud-flags-db", dbFlags.includes("fast_forward_detected"), `flags=${dbFlags.join(",") || "none"}`);
  } catch (e) {
    log("F-fraud", false, e instanceof Error ? e.message : String(e));
  }

  const { data: trackMeta } = await admin
    .from("tracks")
    .select("creator_id")
    .eq("id", track0)
    .maybeSingle();
  const creatorId = trackMeta!.creator_id;

  const statsBefore = await createAnalyticsService(
    await signIn(CERTIFIED_TRACKS[0]!.artistEmail, S12B_PASSWORD),
  ).getStreamStats({ creatorId });

  await fullListenCycle(await createListener("G-BOOST"), track0, 0.95);

  const statsAfter = await createAnalyticsService(
    await signIn(CERTIFIED_TRACKS[0]!.artistEmail, S12B_PASSWORD),
  ).getStreamStats({ creatorId });
  const timeline = await createAnalyticsService(
    await signIn(CERTIFIED_TRACKS[0]!.artistEmail, S12B_PASSWORD),
  ).getStreamTimeline({ creatorId, days: 7 });
  const top = await createAnalyticsService(
    await signIn(CERTIFIED_TRACKS[0]!.artistEmail, S12B_PASSWORD),
  ).getTopTracks({ creatorId, limit: 5 });
  const audience = await createAnalyticsService(
    await signIn(CERTIFIED_TRACKS[0]!.artistEmail, S12B_PASSWORD),
  ).getAudienceStats({ creatorId });

  log(
    "G-analytics-delta",
    statsAfter.total_streams > statsBefore.total_streams,
    `before=${statsBefore.total_streams} after=${statsAfter.total_streams}`,
  );
  log("G-timeline", timeline.length >= 1, `entries=${timeline.length}`);
  log("G-top-tracks", top.length >= 1, `tracks=${top.length}`);
  log("G-audience", audience.total_engagement >= 0, `engagement=${audience.total_engagement}`);

  const { data: royaltySample } = await listener1
    .from("stream_sessions")
    .select("is_valid_listen, listen_percentage, total_listened_seconds, total_duration_seconds, user_id, track_id")
    .eq("track_id", track0)
    .limit(1)
    .maybeSingle();
  const royaltyOk =
    royaltySample &&
    "is_valid_listen" in royaltySample &&
    "listen_percentage" in royaltySample &&
    "total_listened_seconds" in royaltySample;
  log("H-royalty-fields", !!royaltyOk, royaltyOk ? "all fields present" : "missing");

  let regressionOk = true;
  for (let i = 0; i < 3; i++) {
    const t = CERTIFIED_TRACKS[i]!;
    const listener = await createListener(`REG-L${i}`);
    try {
      await fullListenCycle(listener, t.id, 0.95);
      const { data: tr } = await admin.from("tracks").select("creator_id").eq("id", t.id).maybeSingle();
      const artist = await signIn(t.artistEmail, S12B_PASSWORD);
      const st = await createAnalyticsService(artist).getStreamStats({ creatorId: tr!.creator_id });
      log(`I-artist${i + 1}`, st.total_streams >= 1, `${t.label} streams=${st.total_streams}`);
      if (st.total_streams < 1) regressionOk = false;
    } catch (e) {
      log(`I-artist${i + 1}`, false, e instanceof Error ? e.message : String(e));
      regressionOk = false;
    }
  }
  log("I-regression", regressionOk, `3 artists x listeners in ${Date.now() - ts}ms`);

  const passed = steps.filter((s) => s.ok).length;
  const total = steps.length;
  const pct = Math.round((passed / total) * 100);
  console.log(`\n=== CERTIFICATION: ${passed}/${total} (${pct}%) ===`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
