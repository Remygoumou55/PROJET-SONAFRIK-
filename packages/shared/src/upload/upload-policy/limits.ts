/**
 * SONAFRIK — Upload Policy Enterprise
 * Limites de taille officielles par catégorie d'asset.
 *
 * SOURCE UNIQUE DE VÉRITÉ pour toutes les limites de taille.
 * En Phase 2, tous les `MAX_SIZE_BYTES` / `MAX_UPLOAD_BYTES` locaux
 * seront supprimés et remplacés par ces constantes.
 */

/** Registre des limites officielles par catégorie d'asset */
export const UPLOAD_LIMITS = {
  audio: {
    maxBytes: 100 * 1024 * 1024,
    maxMB:    100,
    maxLabel: "100 Mo",
  },
  image: {
    maxBytes: 10 * 1024 * 1024,
    maxMB:    10,
    maxLabel: "10 Mo",
  },
  document: {
    maxBytes: 20 * 1024 * 1024,
    maxMB:    20,
    maxLabel: "20 Mo",
  },
} as const;

// ─── Raccourcis ───────────────────────────────────────────────────────────────

/** Taille maximale pour les fichiers audio (octets) — 100 Mo */
export const MAX_AUDIO_SIZE    = UPLOAD_LIMITS.audio.maxBytes;

/** Taille maximale pour les fichiers image (octets) — 10 Mo */
export const MAX_IMAGE_SIZE    = UPLOAD_LIMITS.image.maxBytes;

/** Taille maximale pour les documents (octets) — 20 Mo */
export const MAX_DOCUMENT_SIZE = UPLOAD_LIMITS.document.maxBytes;
