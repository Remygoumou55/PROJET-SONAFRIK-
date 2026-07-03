/**
 * SONAFRIK — Upload Policy Enterprise
 * Helpers réutilisables pour la validation et la résolution d'assets upload.
 *
 * Ces fonctions ne sont pas encore connectées aux composants existants.
 * Elles constituent la fondation pour la Phase 2 de migration.
 */

import {
  ALL_EXT_TO_MIME,
  AUDIO_EXT_TO_MIME,
  AUDIO_MIME_CANONICAL,
  AUDIO_POLICY,
  DOCUMENT_POLICY,
  IMAGE_EXT_TO_MIME,
  IMAGE_POLICY,
  UPLOAD_POLICIES,
} from "./constants";
import { UploadCategory, UploadErrorCode } from "./enums";
import {
  UPLOAD_ERROR_MESSAGES,
  UPLOAD_FORMAT_HINTS,
  uploadFormatNotAllowedMessage,
  uploadSizeExceededMessage,
} from "./messages";
import type { AllowedMime, UploadFileDescriptor, UploadValidationResult } from "./types";

// ─── Formatage ────────────────────────────────────────────────────────────────

/** Formate un nombre d'octets en chaîne lisible (ex. "4,5 Mo" ou "200 Ko") */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ─── Détection de catégorie ───────────────────────────────────────────────────

/** Retourne true si le MIME type (incluant alias) est un audio autorisé */
export function isAudio(mime: string): boolean {
  return (AUDIO_POLICY.mimesWithAliases as string[]).includes(mime);
}

/** Retourne true si le MIME type est une image autorisée */
export function isImage(mime: string): boolean {
  return (IMAGE_POLICY.mimes as string[]).includes(mime);
}

/** Retourne true si le MIME type est un document autorisé */
export function isDocument(mime: string): boolean {
  return (DOCUMENT_POLICY.mimes as string[]).includes(mime);
}

/** Retourne la catégorie d'upload pour un MIME type, ou null si non reconnu */
export function resolveCategory(mime: string): UploadCategory | null {
  if (isAudio(mime)) return UploadCategory.AUDIO;
  if (isImage(mime)) return UploadCategory.IMAGE;
  if (isDocument(mime)) return UploadCategory.DOCUMENT;
  return null;
}

// ─── Helpers MIME ─────────────────────────────────────────────────────────────

/** Normalise un alias MIME navigateur vers sa forme canonique SONAFRIK */
export function normalizeMime(mime: string): string {
  return AUDIO_MIME_CANONICAL[mime] ?? mime;
}

/** Retourne true si le MIME (incluant alias) est autorisé pour la catégorie donnée */
export function isAllowedMime(mime: string, category: UploadCategory): boolean {
  return (UPLOAD_POLICIES[category].mimesWithAliases as string[]).includes(mime);
}

// ─── Helpers extension ────────────────────────────────────────────────────────

/** Extrait l'extension de fichier en minuscules (sans point), ou null */
export function resolveExtension(filename: string): string | null {
  const parts = filename.split(".");
  if (parts.length < 2) return null;
  return parts[parts.length - 1]?.toLowerCase() ?? null;
}

/** Retourne true si l'extension du fichier est autorisée pour la catégorie donnée */
export function isAllowedExtension(filename: string, category: UploadCategory): boolean {
  const ext = resolveExtension(filename);
  if (!ext) return false;
  return (UPLOAD_POLICIES[category].extensions as string[]).includes(ext);
}

/** Résout le MIME canonique depuis l'extension d'un fichier, ou null si inconnue */
export function resolveMimeFromExtension(filename: string): AllowedMime | null {
  const ext = resolveExtension(filename);
  if (!ext) return null;
  const mime = ALL_EXT_TO_MIME[ext];
  return mime ? (mime as AllowedMime) : null;
}

/**
 * Résout le MIME effectif d'un fichier pour l'upload :
 * 1. Normalise file.type (ex. "audio/mp3" → "audio/mpeg")
 * 2. Si le MIME normalisé est reconnu → le retourne
 * 3. Sinon fallback sur l'extension du nom de fichier
 * 4. Retourne null si aucune résolution possible
 */
export function resolveUploadMime(file: UploadFileDescriptor): AllowedMime | null {
  if (file.type) {
    const normalized = normalizeMime(file.type);
    if (resolveCategory(normalized)) return normalized as AllowedMime;
    if (resolveCategory(file.type)) return file.type as AllowedMime;
  }
  return resolveMimeFromExtension(file.name);
}

// ─── Helpers taille ───────────────────────────────────────────────────────────

/** Retourne true si la taille du fichier est dans la limite autorisée pour la catégorie */
export function isAllowedSize(bytes: number, category: UploadCategory): boolean {
  return bytes > 0 && bytes <= UPLOAD_POLICIES[category].maxBytes;
}

// ─── Validation complète ─────────────────────────────────────────────────────

/**
 * Valide un fichier contre la politique d'upload de sa catégorie.
 * Contrôles effectués : taille > 0, taille ≤ max, MIME ou extension autorisé.
 *
 * Note : cette fonction ne vérifie PAS l'intégrité binaire (magic bytes).
 * La vérification des magic bytes requiert `validateAudioAsset` (packages/shared/audio).
 */
export function validateUploadFile(
  file: UploadFileDescriptor,
  category: UploadCategory,
): UploadValidationResult {
  const policy = UPLOAD_POLICIES[category];

  if (file.size <= 0) {
    return {
      valid: false,
      errorCode: UploadErrorCode.FILE_EMPTY,
      message: UPLOAD_ERROR_MESSAGES.FILE_EMPTY,
    };
  }

  if (file.size > policy.maxBytes) {
    return {
      valid: false,
      errorCode: UploadErrorCode.SIZE_EXCEEDED,
      message: uploadSizeExceededMessage(formatFileSize(file.size), policy.maxLabel),
    };
  }

  const normalizedMime  = normalizeMime(file.type);
  const mimeAllowed     = isAllowedMime(file.type, category) || isAllowedMime(normalizedMime, category);
  const extAllowed      = isAllowedExtension(file.name, category);

  if (!mimeAllowed && !extAllowed) {
    const received = file.type || resolveExtension(file.name) || "?";
    const hint =
      category === UploadCategory.AUDIO    ? UPLOAD_FORMAT_HINTS.AUDIO
      : category === UploadCategory.IMAGE  ? UPLOAD_FORMAT_HINTS.IMAGE
      : UPLOAD_FORMAT_HINTS.DOCUMENT;

    return {
      valid: false,
      errorCode: UploadErrorCode.FORMAT_NOT_ALLOWED,
      message: uploadFormatNotAllowedMessage(received, category, hint),
    };
  }

  return { valid: true };
}

// ─── Helpers spécialisés ──────────────────────────────────────────────────────

/**
 * Résout le MIME de contenu pour un document de vérification.
 * Gère le cas où le navigateur ne rapporte pas le bon type (PDF sur Android/Windows).
 * Fallback sur extension. Throw si format non reconnu.
 */
export function resolveVerificationDocMime(
  file: UploadFileDescriptor,
): "image/jpeg" | "image/png" | "image/webp" | "application/pdf" {
  const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
  type DocMime = (typeof ALLOWED)[number];

  if ((ALLOWED as readonly string[]).includes(file.type)) return file.type as DocMime;

  const ext = resolveExtension(file.name);
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "pdf") return "application/pdf";

  throw new Error(
    `Format non reconnu (${file.type || ext || "?"}) — ${UPLOAD_FORMAT_HINTS.IMAGE} ${UPLOAD_FORMAT_HINTS.DOCUMENT}`,
  );
}

/**
 * Résout le MIME canonique pour un fichier audio destiné au catalogue.
 * Normalise les alias (audio/mp3, audio/m4a…) et fait un fallback extension.
 * Retourne null si le format n'est pas un audio SONAFRIK valide.
 */
export function resolveAudioUploadMime(file: UploadFileDescriptor): string | null {
  const fromMime = normalizeMime(file.type);
  if (isAudio(fromMime)) return fromMime;
  if (isAudio(file.type)) return file.type;

  const ext = resolveExtension(file.name);
  if (ext && ext in AUDIO_EXT_TO_MIME) return AUDIO_EXT_TO_MIME[ext] ?? null;

  return null;
}

/**
 * Résout le MIME canonique pour un fichier image.
 * Fallback sur extension. Retourne "image/jpeg" par défaut si reconnu visuellement.
 */
export function resolveImageUploadMime(file: UploadFileDescriptor): "image/jpeg" | "image/png" | "image/webp" | null {
  type ImageMime = "image/jpeg" | "image/png" | "image/webp";
  const ALLOWED: readonly string[] = ["image/jpeg", "image/png", "image/webp"];

  if (ALLOWED.includes(file.type)) return file.type as ImageMime;

  const ext = resolveExtension(file.name);
  if (ext && ext in IMAGE_EXT_TO_MIME) return (IMAGE_EXT_TO_MIME[ext] ?? null) as ImageMime | null;

  return null;
}
