/**
 * Validation intégrité assets audio — source unique (web, api, scripts, edge mirror).
 */

import { AUDIO_MIME_CANONICAL, AUDIO_MIME_TO_DB_FORMAT } from "../upload/upload-policy";

export const WEB_PLAYBACK_FORMATS = ["mp3", "m4a", "aac", "wav"] as const;
export type WebPlaybackFormat = (typeof WEB_PLAYBACK_FORMATS)[number];

// Derived from AUDIO_MIME_TO_DB_FORMAT — WAV excluded (not browser-native without transcoding)
export const UPLOAD_AUDIO_MIME: Record<string, WebPlaybackFormat> = Object.fromEntries(
  Object.entries(AUDIO_MIME_TO_DB_FORMAT)
    .filter(([, fmt]) => (WEB_PLAYBACK_FORMATS as readonly string[]).includes(fmt))
    .map(([mime, fmt]) => [mime, fmt as WebPlaybackFormat]),
);

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
export const MIN_BLOB_BYTES = 64;
export const HEADER_PROBE_BYTES = 512;

export type TrackFileIntegrityStatus = "pending" | "valid" | "invalid" | "needs_review";

export type DetectedContainer = "mp3" | "m4a" | "wav" | "flac" | "unknown";

export interface AudioIntegrityResult {
  status: TrackFileIntegrityStatus;
  message: string;
  container: DetectedContainer;
  webCompatible: boolean;
}

export function mimeToUploadFormat(mime: string): WebPlaybackFormat | null {
  const canonical = AUDIO_MIME_CANONICAL[mime] ?? mime;
  return UPLOAD_AUDIO_MIME[canonical] ?? UPLOAD_AUDIO_MIME[mime] ?? null;
}

export function isWebPlaybackFormat(format: string): format is WebPlaybackFormat {
  return (WEB_PLAYBACK_FORMATS as readonly string[]).includes(format);
}

export function isUploadSizeValid(bytes: number): boolean {
  return bytes > 0 && bytes <= MAX_UPLOAD_BYTES;
}

export function detectContainerFromBytes(header: Uint8Array): DetectedContainer {
  if (header.length < 4) return "unknown";

  if (
    (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) ||
    (header.length >= 2 && header[0] === 0xff && ((header[1] ?? 0) & 0xe0) === 0xe0)
  ) {
    return "mp3";
  }

  if (
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header.length >= 12 &&
    header[8] === 0x57 &&
    header[9] === 0x41 &&
    header[10] === 0x56 &&
    header[11] === 0x45
  ) {
    return "wav";
  }

  // Standard MP4/M4A: "ftyp" atom type at offset 4
  if (header.length >= 8 && header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
    return "m4a";
  }
  // M4A preceded by a "wide" atom (8 bytes, common in iPhone/GarageBand files):
  // bytes 0-7 = [00 00 00 08 77 69 64 65], then the real ftyp atom starts at byte 8
  // → "ftyp" type field lands at bytes 12-15
  if (header.length >= 16 && header[12] === 0x66 && header[13] === 0x74 && header[14] === 0x79 && header[15] === 0x70) {
    return "m4a";
  }

  if (header[0] === 0x66 && header[1] === 0x4c && header[2] === 0x61 && header[3] === 0x43) {
    return "flac";
  }

  return "unknown";
}

export function isMimeConsistentWithContainer(mime: string, container: DetectedContainer): boolean {
  if (container === "unknown") return false;
  if (container === "mp3") return mime === "audio/mpeg" || mime === "audio/mp3";
  if (container === "m4a") return mime.startsWith("audio/") && (mime.includes("mp4") || mime.includes("m4a"));
  if (container === "wav") return mime === "audio/wav" || mime === "audio/wave";
  if (container === "flac") return mime.includes("flac");
  return false;
}

export function containerMatchesDbFormat(container: DetectedContainer, dbFormat: string): boolean {
  if (container === "mp3" && dbFormat === "mp3") return true;
  if (container === "m4a" && (dbFormat === "aac" || dbFormat === "m4a")) return true;
  if (container === "wav" && dbFormat === "wav") return true;
  return false;
}

export function validateAudioAsset(input: {
  header: Uint8Array;
  mime: string;
  fileSizeBytes: number;
  dbFormat: string;
}): AudioIntegrityResult {
  const { header, mime, fileSizeBytes, dbFormat } = input;

  if (fileSizeBytes <= 0) {
    return { status: "invalid", message: "Fichier vide.", container: "unknown", webCompatible: false };
  }
  if (fileSizeBytes < MIN_BLOB_BYTES) {
    return { status: "invalid", message: "Fichier trop petit (stub ou corrompu).", container: "unknown", webCompatible: false };
  }
  if (fileSizeBytes > MAX_UPLOAD_BYTES) {
    return { status: "invalid", message: `Fichier dépasse ${MAX_UPLOAD_BYTES / 1024 / 1024} Mo.`, container: "unknown", webCompatible: false };
  }

  const container = detectContainerFromBytes(header);
  if (container === "unknown") {
    return { status: "invalid", message: "En-tête audio non reconnu.", container, webCompatible: false };
  }

  if (!isMimeConsistentWithContainer(mime, container)) {
    return { status: "invalid", message: "MIME incohérent avec le conteneur détecté.", container, webCompatible: false };
  }

  // FLAC: not browser-native, requires transcoding
  if (container === "flac" || dbFormat === "flac") {
    return {
      status: "needs_review",
      message: "Format FLAC — transcodage requis avant diffusion.",
      container,
      webCompatible: false,
    };
  }

  if (!containerMatchesDbFormat(container, dbFormat)) {
    return {
      status: "invalid",
      message: `Conteneur ${container} incompatible avec format catalogue ${dbFormat}.`,
      container,
      webCompatible: false,
    };
  }

  if (!isWebPlaybackFormat(dbFormat)) {
    return { status: "invalid", message: "Format non compatible lecture web.", container, webCompatible: false };
  }

  return { status: "valid", message: "Asset validé.", container, webCompatible: true };
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
