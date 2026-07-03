/**
 * SONAFRIK — Upload Policy Enterprise
 * Bibliothèque officielle de messages d'upload.
 *
 * RÈGLE : Aucun texte d'erreur ou de statut upload en dur dans les composants.
 * Tous les messages passent par ce fichier.
 */

import { UploadCategory } from "./enums";

// ─── Labels catégories (usage interne) ────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  [UploadCategory.AUDIO]:    "l'audio",
  [UploadCategory.IMAGE]:    "l'image",
  [UploadCategory.DOCUMENT]: "le document",
};

// ─── Messages statiques ───────────────────────────────────────────────────────

/** Messages d'erreur statiques */
export const UPLOAD_ERROR_MESSAGES = {
  FILE_EMPTY:        "Le fichier est vide.",
  FILE_TOO_SMALL:    "Le fichier est trop petit ou corrompu.",
  UNKNOWN_FORMAT:    "Format de fichier non reconnu.",
  MIME_MISMATCH:     "Le type MIME du fichier ne correspond pas à son contenu.",
  NEEDS_TRANSCODING: "Ce format requiert un transcodage avant diffusion web.",
  INTEGRITY_FAILED:  "La vérification d'intégrité du fichier a échoué.",
} as const;

/** Messages de statut upload */
export const UPLOAD_STATUS_MESSAGES = {
  IN_PROGRESS: "Envoi en cours…",
  VALIDATING:  "Validation en cours…",
  PROCESSING:  "Traitement en cours…",
  SUCCESS:     "Fichier envoyé avec succès.",
  CANCELLED:   "Envoi annulé.",
} as const;

/** Hints de formats par catégorie */
export const UPLOAD_FORMAT_HINTS = {
  AUDIO:    "Formats acceptés : MP3, M4A, WAV.",
  IMAGE:    "Formats acceptés : JPEG, PNG, WebP.",
  DOCUMENT: "Formats acceptés : PDF.",
} as const;

/** Hints de taille par catégorie */
export const UPLOAD_SIZE_HINTS = {
  AUDIO:    "Taille maximale : 100 Mo.",
  IMAGE:    "Taille maximale : 10 Mo.",
  DOCUMENT: "Taille maximale : 20 Mo.",
} as const;

// ─── Messages paramétriques ───────────────────────────────────────────────────

/**
 * Génère un message de format non autorisé.
 * Ex: "Format non autorisé (audio/ogg) pour l'audio. Formats acceptés : MP3, M4A, WAV."
 */
export function uploadFormatNotAllowedMessage(
  received: string,
  category: UploadCategory | string,
  hint: string,
): string {
  const label = CATEGORY_LABEL[category] ?? category;
  return `Format non autorisé (${received || "inconnu"}) pour ${label}. ${hint}`;
}

/**
 * Génère un message de taille dépassée.
 * Ex: "Fichier trop lourd (105,3 Mo). Maximum autorisé : 100 Mo."
 */
export function uploadSizeExceededMessage(actualLabel: string, maxLabel: string): string {
  return `Fichier trop lourd (${actualLabel}). Maximum autorisé : ${maxLabel}.`;
}

// ─── Export groupé ────────────────────────────────────────────────────────────

/** Accès regroupé à tous les messages d'upload */
export const UPLOAD_MESSAGES = {
  error:  UPLOAD_ERROR_MESSAGES,
  status: UPLOAD_STATUS_MESSAGES,
  hint: {
    format: UPLOAD_FORMAT_HINTS,
    size:   UPLOAD_SIZE_HINTS,
  },
  formatNotAllowed: uploadFormatNotAllowedMessage,
  sizeExceeded:     uploadSizeExceededMessage,
} as const;
