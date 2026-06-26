/**
 * Politique certification Pipeline Audio — réexporte @sonafrik/shared + constantes probes.
 */
export {
  WEB_PLAYBACK_FORMATS,
  UPLOAD_AUDIO_MIME,
  MAX_UPLOAD_BYTES,
  MIN_BLOB_BYTES,
  detectContainerFromBytes,
  isMimeConsistentWithContainer,
  mimeToUploadFormat,
  isWebPlaybackFormat,
  isUploadSizeValid,
  validateAudioAsset,
  type WebPlaybackFormat,
  type DetectedContainer,
  type TrackFileIntegrityStatus,
} from "../../packages/shared/src/audio/audio-integrity";

/** MIME autorisés bucket catalog-audio (DB) — WAV/FLAC stockables mais non servis web MVP */
export const STORAGE_AUDIO_MIME = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-flac",
  "audio/flac",
] as const;

export const STREAM_SIGNED_URL_TTL_SEC = 1800;
export const CATALOG_SIGNED_URL_TTL_SEC = 3600;
export const MIN_BLOB_BYTES_STREAM = 64;
export const HEADER_PROBE_BYTES = 512;

export const OBSERVABILITY_FIELDS = ["sessionId", "trackId", "userId"] as const;
export const OBSERVABILITY_GAPS = ["playbackId", "correlationId", "traceId"] as const;
