/**
 * Audio Pipeline Remediation Program — probe officiel.
 * Usage: pnpm probe:audio-remediation
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
let passed = 0;
let total = 0;

function log(id: string, ok: boolean, detail: string): void {
  total++;
  if (ok) passed++;
  console.log(`${ok ? "✅" : "❌"} [${id}] ${detail}`);
}

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(resolve(ROOT, rel));
}

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════");
  console.log("AUDIO PIPELINE REMEDIATION PROGRAM");
  console.log("═══════════════════════════════════════════════\n");

  console.log("── Phase A — Root cause documented ──\n");
  log("A-REMEDIATION-DOC", exists("docs/audio/AUDIO_REMEDIATION.md"), "AUDIO_REMEDIATION.md");
  log("A-HARDENING-DOC", exists("docs/audio/AUDIO_HARDENING.md"), "AUDIO_HARDENING.md");

  console.log("\n── Phase B/C — Storage + Metadata ──\n");
  const mig = read("supabase/migrations/20260626140000_audio_integrity_remediation.sql");
  log("B-INTEGRITY-COL", mig.includes("integrity_status"), "colonne integrity_status");
  log("C-SUBMIT-GATE", mig.includes("NOT IN ('valid', 'pending')"), "garde-fou submit");

  console.log("\n── Phase D/E — Signed URL + Codec ──\n");
  const edge = read("supabase/functions/catalog-asset-signed-url/index.ts");
  const stream = read("supabase/functions/stream-start/index.ts");
  log("D-CONFIRM", edge.includes('action === "confirm"'), "action confirm post-upload");
  log("D-INTEGRITY-EDGE", exists("supabase/functions/_shared/audio-integrity.ts"), "module edge");
  log("E-STREAM-BLOCK", stream.includes("integrity_status"), "stream-start integrity");

  console.log("\n── Phase F/G — Player + Upload ──\n");
  const uploader = read("apps/web/src/features/creator/catalog/components/AudioUploader.tsx");
  const player = read("apps/web/src/features/listener/lib/playerContext.tsx");
  log("F-PLAYER-MSG", player.includes("fichier corrompu"), "message codec clair");
  log("G-MAGIC-BYTES", uploader.includes("validateAudioAsset"), "validation client");
  log("G-CONFIRM", uploader.includes("confirmAssetUpload"), "confirmation serveur");
  log("G-SHA256", uploader.includes("sha256Hex"), "hash intégrité");

  console.log("\n── Phase H/K — Self-healing + Data ──\n");
  log("H-REMEDIATE-SCRIPT", exists("scripts/remediate-audio-storage.ts"), "script idempotent");
  log("K-DRY-RUN", read("scripts/remediate-audio-storage.ts").includes("--apply"), "mode dry-run");

  console.log("\n── Phase J/L — Tests + Shared ──\n");
  log("J-SHARED-MODULE", exists("packages/shared/src/audio/audio-integrity.ts"), "module partagé");
  log("J-SHARED-TEST", exists("packages/shared/src/audio/audio-integrity.test.ts"), "tests shared");
  log("L-CATALOG-CONFIRM", read("packages/api/src/catalog/catalog.service.ts").includes("confirmAssetUpload"), "catalog service");

  console.log(`\nTOTAL : ${passed}/${total}`);
  process.exit(passed === total ? 0 : 1);
}

void main();
