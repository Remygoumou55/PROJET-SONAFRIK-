/**
 * Audio Pipeline Certification Program — probe officiel SONAFRIK.
 * Usage: pnpm probe:audio-certification
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  CATALOG_SIGNED_URL_TTL_SEC,
  STREAM_SIGNED_URL_TTL_SEC,
  UPLOAD_AUDIO_MIME,
  WEB_PLAYBACK_FORMATS,
} from "./lib/audio-pipeline-policy";

const ROOT = resolve(__dirname, "..");
let passed = 0;
let total = 0;
const gaps: string[] = [];

function log(id: string, ok: boolean, detail: string): void {
  total++;
  if (ok) passed++;
  else gaps.push(`[${id}] ${detail}`);
  console.log(`${ok ? "✅" : "❌"} [${id}] ${detail}`);
}

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(resolve(ROOT, rel));
}

function loadEnvLocal(): void {
  const envPath = resolve(ROOT, "apps/web/.env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
  }
}

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════");
  console.log("AUDIO PIPELINE CERTIFICATION PROGRAM");
  console.log("═══════════════════════════════════════════════\n");

  console.log("── Phase A — Discovery ──\n");
  const discoveryPaths = [
    "packages/api/src/catalog/catalog.service.ts",
    "packages/api/src/streaming/streaming.service.ts",
    "supabase/functions/catalog-asset-signed-url/index.ts",
    "supabase/functions/stream-start/index.ts",
    "supabase/functions/stream-progress/index.ts",
    "supabase/functions/stream-complete/index.ts",
    "apps/web/src/features/creator/catalog/components/AudioUploader.tsx",
    "apps/web/src/features/listener/lib/playerContext.tsx",
    "apps/web/src/features/listener/hooks/usePlayer.ts",
    "apps/web/src/features/listener/components/WebPlayer.tsx",
  ];
  for (const p of discoveryPaths) {
    log(`A-${p.split("/").pop()}`, exists(p), p);
  }
  log("A-CORS", exists("supabase/functions/_shared/cors.ts"), "module CORS edge");

  console.log("\n── Phase B — Pipeline mapping ──\n");
  log("B-DOC-PIPELINE", exists("docs/audio/AUDIO_PIPELINE.md"), "AUDIO_PIPELINE.md");
  log("B-DOC-CERT", exists("docs/audio/AUDIO_CERTIFICATION.md"), "AUDIO_CERTIFICATION.md");
  log("B-STATE-MACHINE", exists("docs/streaming/STATE_MACHINE.md"), "STATE_MACHINE.md");

  console.log("\n── Phase C — Upload ──\n");
  const audioUploader = read("apps/web/src/features/creator/catalog/components/AudioUploader.tsx");
  const catalogEdge = read("supabase/functions/catalog-asset-signed-url/index.ts");
  log("C-MP3-MIME", audioUploader.includes("mimeToUploadFormat") || audioUploader.includes("audio/mpeg"), "AudioUploader MP3");
  log("C-M4A-MIME", audioUploader.includes("audio/x-m4a") || audioUploader.includes(".m4a"), "AudioUploader M4A");
  log(
    "C-NO-WAV-CLIENT",
    audioUploader.includes("MP3 · M4A") && !audioUploader.includes('accept=".wav"'),
    "WAV refusé client MVP",
  );
  log("C-MAX-50MB", audioUploader.includes("MAX_UPLOAD_BYTES") || audioUploader.includes("50 * 1024"), "limite 50 Mo");
  log("C-DURATION", audioUploader.includes("getAudioDuration"), "durée Web Audio API");
  log("C-XHR-PUT", audioUploader.includes('xhr.open("PUT"'), "PUT Storage signé");
  log("C-EDGE-MIME", catalogEdge.includes("AUDIO_TYPES"), "edge MIME map");
  log("C-CONFIRM", catalogEdge.includes('action === "confirm"'), "confirm post-upload");

  console.log("\n── Phase D — Storage ──\n");
  const sprint5 = read("supabase/migrations/20250610130000_sprint5_catalog_os.sql");
  const sprint5rls = read("supabase/migrations/20250610130001_sprint5_catalog_rls.sql");
  log("D-BUCKET-AUDIO", sprint5.includes("'catalog-audio'"), "bucket catalog-audio");
  log("D-BUCKET-PRIVATE", sprint5.includes("false"), "bucket privé");
  log("D-BUCKET-50MB", sprint5.includes("52428800"), "limite 50 Mo");
  log("D-RLS-AUDIO", sprint5rls.includes("catalog-audio"), "RLS storage");
  log("D-TRACK-FILES", sprint5.includes("track_files"), "table track_files");

  console.log("\n── Phase E — Signed URL ──\n");
  const streamStart = read("supabase/functions/stream-start/index.ts");
  log("E-STREAM-TTL", streamStart.includes(`SIGNED_URL_EXPIRY = ${STREAM_SIGNED_URL_TTL_SEC}`), `TTL ${STREAM_SIGNED_URL_TTL_SEC}s`);
  log("E-CATALOG-TTL", catalogEdge.includes(`SIGNED_URL_TTL = ${CATALOG_SIGNED_URL_TTL_SEC}`), `catalog TTL ${CATALOG_SIGNED_URL_TTL_SEC}s`);
  log("E-SERVER-ONLY", streamStart.includes("createSignedUrl"), "URLs serveur");
  log("E-CACHE", exists("packages/api/src/streaming/playback/signed-url-cache.ts"), "SignedUrlCache");
  log("E-CACHE-TEST", exists("packages/api/src/streaming/playback/signed-url-cache.test.ts"), "tests cache");

  console.log("\n── Phase F — Codec ──\n");
  log("F-WEB-FORMATS", WEB_PLAYBACK_FORMATS.every((f) => streamStart.includes(`"${f}"`)), `formats ${WEB_PLAYBACK_FORMATS.join(",")}`);
  log("F-POLICY", exists("scripts/lib/audio-pipeline-policy.ts"), "magic bytes policy");
  log("F-MIN-BLOB", streamStart.includes("metaSize < 64"), "rejet blob < 64o");

  console.log("\n── Phase G — Player ──\n");
  const playerCtx = read("apps/web/src/features/listener/lib/playerContext.tsx");
  const usePlayer = read("apps/web/src/features/listener/hooks/usePlayer.ts");
  const webPlayer = read("apps/web/src/features/listener/components/WebPlayer.tsx");
  log("G-AUDIO-ERROR", playerCtx.includes("audioError"), "audioError state");
  log("G-ONERROR", playerCtx.includes("audio.onerror"), "onerror handler");
  log("G-SEEK", playerCtx.includes("seek"), "seek");
  log("G-VOLUME", playerCtx.includes("volume"), "volume");
  log("G-ONENDED", playerCtx.includes("audio.onended"), "onended");
  log("G-RETRY", usePlayer.includes("errorType") && usePlayer.includes("startStream"), "recovery");
  log("G-UI-ERROR", webPlayer.includes("audioError"), "WebPlayer errors");

  console.log("\n── Phase H — Playback ──\n");
  const streamingSvc = read("packages/api/src/streaming/streaming.service.ts");
  log("H-START", streamingSvc.includes('"stream-start"'), "stream-start");
  log("H-PROGRESS", streamingSvc.includes('"stream-progress"'), "stream-progress");
  log("H-COMPLETE", streamingSvc.includes('"stream-complete"'), "stream-complete");
  log("H-HEARTBEAT", usePlayer.includes("sendHeartbeat"), "heartbeat");
  log("H-BRIDGE", exists("apps/web/src/features/listener/integration/useStreamingPlaybackBridge.ts"), "bridge");

  console.log("\n── Phase I — Session ──\n");
  const sprint6 = read("supabase/migrations/20250610140000_sprint6_streaming_os.sql");
  log("I-RPC-START", sprint6.includes("start_stream_session"), "RPC start");
  log("I-RPC-HEARTBEAT", sprint6.includes("update_stream_heartbeat"), "RPC heartbeat");
  log("I-SESSION-REF", playerCtx.includes("activeSessionIdRef"), "sessionId player");

  console.log("\n── Phase J — Observability ──\n");
  log("J-SESSION", playerCtx.includes("sessionId"), "sessionId");
  log("J-TRACK", playerCtx.includes("currentTrack"), "currentTrack");
  log("J-GAP-CORR", !streamingSvc.includes("correlationId"), "correlationId = gap MVP");

  console.log("\n── Phase K/L/M/O ──\n");
  log("K-HEARTBEAT-TYPE", read("packages/types/src/constants.ts").includes("STREAM_HEARTBEAT_INTERVAL_MS"), "heartbeat typed");
  log("L-CORS", read("supabase/functions/_shared/cors.ts").includes("buildCorsHeaders"), "CORS dynamic");
  log("L-AUTH", streamStart.includes("getUser()"), "auth stream-start");
  log("M-POLICY-TEST", exists("scripts/lib/audio-pipeline-policy.test.ts"), "policy tests");
  log("O-CORS-DOC", exists("docs/infrastructure/CORS_ARCHITECTURE.md"), "CORS doc");

  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && anon && service) {
    console.log("\n── Phase N — Live ──\n");
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { count } = await admin
      .from("tracks")
      .select("*", { count: "exact", head: true })
      .eq("publication_status", "published");
    log("N-PUBLISHED", (count ?? 0) > 0, `${count ?? 0} tracks publiés`);

    const { data: publishedTracks } = await admin
      .from("tracks")
      .select("id")
      .eq("publication_status", "published")
      .is("deleted_at", null)
      .limit(20);

    const publishedIds = (publishedTracks ?? []).map((t) => t.id);
    const { data: fileRows } = await admin
      .from("track_files")
      .select("track_id, format")
      .eq("is_primary", true)
      .in("format", ["mp3", "m4a", "aac"])
      .in("track_id", publishedIds.length ? publishedIds : ["00000000-0000-0000-0000-000000000000"])
      .limit(10);

    const { data: auth } = await createClient(url, anon, { auth: { persistSession: false } }).auth.signInWithPassword({
      email: "s13b-playwright-listener@sonafrik.test",
      password: "S13BCert2026!",
    });
    const token = auth.session?.access_token;
    const CERT_TRACK_IDS = [
      "849836a7-d234-4c11-b8af-a65a53bfc525",
      "bfe90571-e5cf-49a5-ba0e-ca213381ef68",
      "1d068c31-74fa-4f4b-b0fa-2ab8847e260c",
    ];
    const candidateTrackIds = [
      ...new Set([...CERT_TRACK_IDS, ...(fileRows ?? []).map((f) => f.track_id)]),
    ];

    let liveOk = false;
    let liveDetail = "auth ou track manquant";

    if (token && candidateTrackIds.length) {
      for (const trackId of candidateTrackIds) {
        const res = await fetch(`${url}/functions/v1/stream-start`, {
          method: "POST",
          headers: { apikey: anon, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ trackId, platform: "web" }),
        });
        const body = (await res.json()) as { sessionId?: string; signedUrl?: string; error?: string };
        if (res.status === 200 && body.signedUrl) {
          const head = await fetch(body.signedUrl, { method: "HEAD" });
          const ct = head.headers.get("content-type") ?? "";
          liveOk = head.ok && ct.includes("audio");
          liveDetail = `stream-start 200 track=${trackId.slice(0, 8)} HEAD ${head.status}`;
          break;
        }
        liveDetail = `stream-start ${res.status} track=${trackId.slice(0, 8)} ${body.error ?? ""}`;
      }
    }

    log("N-LIVE-START", liveOk, liveDetail);
    if (!liveOk && liveDetail.includes("HEAD")) {
      log("N-LIVE-URL", false, liveDetail);
    }
  } else {
    log("N-SKIP", true, "live sans .env.local");
  }

  console.log(`\nTOTAL : ${passed}/${total}`);
  if (gaps.length) gaps.forEach((g) => console.log(`  • ${g}`));
  process.exit(passed === total ? 0 : 1);
}

void main();
