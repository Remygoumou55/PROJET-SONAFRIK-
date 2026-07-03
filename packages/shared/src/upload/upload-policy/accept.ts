/**
 * SONAFRIK — Upload Policy Enterprise
 * Valeurs officielles pour les attributs HTML `<input accept="...">`.
 *
 * Ces constantes dérivent des politiques officielles — une seule source de vérité.
 * En Phase 2, tous les `accept="..."` codés en dur seront remplacés par ces constantes.
 */

import { AUDIO_POLICY, DOCUMENT_POLICY, IMAGE_POLICY } from "./constants";

// ─── Valeurs HTML accept ──────────────────────────────────────────────────────

/** Valeur `accept` pour les fichiers audio — ".mp3,.m4a,.wav" */
export const AUDIO_ACCEPT = AUDIO_POLICY.accept;

/** Valeur `accept` pour les fichiers image — "image/jpeg,image/png,image/webp" */
export const IMAGE_ACCEPT = IMAGE_POLICY.accept;

/** Valeur `accept` pour les documents — "application/pdf" */
export const DOCUMENT_ACCEPT = DOCUMENT_POLICY.accept;

/** Valeur `accept` pour les documents de vérification (images + PDF) */
export const VERIFICATION_ACCEPT = `${IMAGE_ACCEPT},${DOCUMENT_ACCEPT}` as const;

// ─── Registre groupé ──────────────────────────────────────────────────────────

/** Registre des valeurs `accept` par contexte d'upload */
export const UPLOAD_ACCEPT = {
  audio:        AUDIO_ACCEPT,
  image:        IMAGE_ACCEPT,
  document:     DOCUMENT_ACCEPT,
  verification: VERIFICATION_ACCEPT,
} as const;

export type UploadAcceptKey = keyof typeof UPLOAD_ACCEPT;
