/**
 * SONAFRIK — Upload Policy Enterprise
 * Constantes officielles : politiques, MIME maps, extension maps.
 *
 * SOURCE UNIQUE DE VÉRITÉ pour :
 * - Formats autorisés par catégorie
 * - Tailles maximales officielles
 * - Normalisation des MIME types
 * - Mapping extension → MIME
 */

import { UploadCategory } from "./enums";
import type { UploadPolicy } from "./types";

// ─── Politiques officielles ───────────────────────────────────────────────────

/** Politique officielle pour les fichiers audio */
export const AUDIO_POLICY: UploadPolicy = {
  category: UploadCategory.AUDIO,
  mimes: ["audio/mpeg", "audio/mp4", "audio/wav"],
  mimesWithAliases: [
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
  ],
  extensions: ["mp3", "m4a", "wav"],
  maxBytes: 100 * 1024 * 1024,
  maxLabel: "100 Mo",
  accept: ".mp3,.m4a,.wav",
};

/** Politique officielle pour les fichiers image */
export const IMAGE_POLICY: UploadPolicy = {
  category: UploadCategory.IMAGE,
  mimes: ["image/jpeg", "image/png", "image/webp"],
  mimesWithAliases: ["image/jpeg", "image/png", "image/webp"],
  extensions: ["jpg", "jpeg", "png", "webp"],
  maxBytes: 10 * 1024 * 1024,
  maxLabel: "10 Mo",
  accept: "image/jpeg,image/png,image/webp",
};

/** Politique officielle pour les documents */
export const DOCUMENT_POLICY: UploadPolicy = {
  category: UploadCategory.DOCUMENT,
  mimes: ["application/pdf"],
  mimesWithAliases: ["application/pdf"],
  extensions: ["pdf"],
  maxBytes: 20 * 1024 * 1024,
  maxLabel: "20 Mo",
  accept: "application/pdf",
};

/** Registre maître — toutes les politiques indexées par catégorie */
export const UPLOAD_POLICIES: Record<UploadCategory, UploadPolicy> = {
  [UploadCategory.AUDIO]:    AUDIO_POLICY,
  [UploadCategory.IMAGE]:    IMAGE_POLICY,
  [UploadCategory.DOCUMENT]: DOCUMENT_POLICY,
};

// ─── Normalisation MIME ───────────────────────────────────────────────────────

/**
 * Alias MIME non-standard → MIME canonique SONAFRIK.
 * Couvre les cas réels observés sur Android, iOS, Windows.
 */
export const AUDIO_MIME_CANONICAL: Readonly<Record<string, string>> = {
  "audio/mp3":   "audio/mpeg",
  "audio/m4a":   "audio/mp4",
  "audio/x-m4a": "audio/mp4",
  "audio/wave":  "audio/wav",
  "audio/x-wav": "audio/wav",
};

// ─── MIME → format DB ─────────────────────────────────────────────────────────

/**
 * MIME audio → identifiant format pour la base de données.
 * Utilisé lors de la confirmation d'upload.
 */
export const AUDIO_MIME_TO_DB_FORMAT: Readonly<Record<string, string>> = {
  "audio/mpeg":  "mp3",
  "audio/mp3":   "mp3",
  "audio/mp4":   "m4a",
  "audio/m4a":   "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav":   "wav",
  "audio/wave":  "wav",
  "audio/x-wav": "wav",
};

// ─── Extension → MIME ─────────────────────────────────────────────────────────

/** Extension audio → MIME canonique */
export const AUDIO_EXT_TO_MIME: Readonly<Record<string, string>> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
};

/** Extension image → MIME canonique */
export const IMAGE_EXT_TO_MIME: Readonly<Record<string, string>> = {
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  webp: "image/webp",
};

/** Extension document → MIME canonique */
export const DOCUMENT_EXT_TO_MIME: Readonly<Record<string, string>> = {
  pdf: "application/pdf",
};

/** Map combinée toutes catégories : extension → MIME canonique */
export const ALL_EXT_TO_MIME: Readonly<Record<string, string>> = {
  ...AUDIO_EXT_TO_MIME,
  ...IMAGE_EXT_TO_MIME,
  ...DOCUMENT_EXT_TO_MIME,
};
