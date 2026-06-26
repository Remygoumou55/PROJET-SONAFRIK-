/**
 * Audio Pipeline Remediation — scan idempotent catalog-audio vs track_files.
 * Usage:
 *   npx tsx scripts/remediate-audio-storage.ts          # dry-run
 *   npx tsx scripts/remediate-audio-storage.ts --apply  # écriture DB
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import {
  validateAudioAsset,
  type TrackFileIntegrityStatus,
} from "../packages/shared/src/audio/audio-integrity";

const APPLY = process.argv.includes("--apply");
const ROOT = resolve(__dirname, "..");

function loadEnv(): void {
  const envPath = resolve(ROOT, "apps/web/.env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1]!.trim()] = m[2]!.trim().replace(/^["']|["']$/g, "");
  }
}

const MIME: Record<string, string> = { mp3: "audio/mpeg", aac: "audio/mp4", wav: "audio/wav", flac: "audio/flac" };

interface RowReport {
  trackId: string;
  title: string;
  path: string;
  format: string;
  published: boolean;
  before: TrackFileIntegrityStatus | null;
  after: TrackFileIntegrityStatus;
  message: string;
  sizeBytes: number;
}

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, service, { auth: { persistSession: false } });

  const { data: rows, error } = await admin
    .from("track_files")
    .select("id, track_id, file_path, format, integrity_status, file_size_bytes, tracks!inner(title, publication_status)")
    .eq("is_primary", true);

  if (error) throw error;

  const reports: RowReport[] = [];
  let valid = 0;
  let invalid = 0;
  let needsReview = 0;
  let pending = 0;

  for (const row of rows ?? []) {
    const track = row.tracks as { title: string; publication_status: string };
    const path = row.file_path as string;
    const format = row.format as string;
    const mime = MIME[format] ?? "audio/mpeg";

    const { data: blob, error: dlErr } = await admin.storage.from("catalog-audio").download(path);

    let after: TrackFileIntegrityStatus = "invalid";
    let message = "Objet Storage introuvable.";
    let sizeBytes = 0;

    if (!dlErr && blob) {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      sizeBytes = bytes.length;
      const validation = validateAudioAsset({
        header: bytes.slice(0, 512),
        mime,
        fileSizeBytes: sizeBytes,
        dbFormat: format,
      });
      after = validation.status;
      message = validation.message;
    }

    if (after === "valid") valid++;
    else if (after === "invalid") invalid++;
    else if (after === "needs_review") needsReview++;
    else pending++;

    reports.push({
      trackId: row.track_id as string,
      title: track.title,
      path,
      format,
      published: track.publication_status === "published",
      before: (row.integrity_status as TrackFileIntegrityStatus) ?? null,
      after,
      message,
      sizeBytes,
    });

    if (APPLY && after !== row.integrity_status) {
      await admin
        .from("track_files")
        .update({
          integrity_status: after,
          integrity_message: message,
          file_size_bytes: sizeBytes || null,
          validated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    }
  }

  const reportPath = resolve(ROOT, "docs/audio/remediation-report.json");
  writeFileSync(
    reportPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), apply: APPLY, summary: { valid, invalid, needsReview, pending, total: reports.length }, rows: reports }, null, 2),
  );

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`Total: ${reports.length} | valid=${valid} invalid=${invalid} needs_review=${needsReview}`);
  console.log(`Rapport: ${reportPath}`);

  const brokenPublished = reports.filter((r) => r.published && r.after !== "valid");
  if (brokenPublished.length) {
    console.log("\n⚠️  Pistes publiées non valides:");
    for (const r of brokenPublished.slice(0, 20)) {
      console.log(`  • ${r.title} (${r.trackId.slice(0, 8)}) — ${r.after}: ${r.message}`);
    }
  }

  process.exit(invalid > 0 && brokenPublished.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
