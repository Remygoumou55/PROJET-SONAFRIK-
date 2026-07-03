/**
 * SONAFRIK — Upload Policy Enterprise
 * Types TypeScript partagés pour toute la logique d'upload.
 * Aucun `any`. TypeScript strict.
 */

import type { UploadCategory, UploadErrorCategory, UploadErrorCode, UploadValidationStatus } from "./enums";

// ─── MIME types officiels ─────────────────────────────────────────────────────

/** MIME types audio — standards + alias navigateurs courants */
export type AudioMime =
  | "audio/mpeg"
  | "audio/mp3"
  | "audio/mp4"
  | "audio/m4a"
  | "audio/x-m4a"
  | "audio/wav"
  | "audio/wave"
  | "audio/x-wav";

/** MIME types image */
export type ImageMime = "image/jpeg" | "image/png" | "image/webp";

/** MIME types document */
export type DocumentMime = "application/pdf";

/** Union de tous les MIME types autorisés dans SONAFRIK */
export type AllowedMime = AudioMime | ImageMime | DocumentMime;

// ─── Politique d'upload ───────────────────────────────────────────────────────

/**
 * Politique complète pour une catégorie d'asset.
 * Définit les formats, tailles et valeurs HTML acceptées.
 */
export interface UploadPolicy {
  /** Catégorie d'asset */
  readonly category: UploadCategory;
  /** MIME types canoniques (sans alias) */
  readonly mimes: string[];
  /** MIME types acceptés incluant les alias navigateur */
  readonly mimesWithAliases: string[];
  /** Extensions de fichier acceptées (minuscules, sans point) */
  readonly extensions: string[];
  /** Taille maximale en octets */
  readonly maxBytes: number;
  /** Label lisible de la taille max (ex. "100 Mo") */
  readonly maxLabel: string;
  /** Valeur pour l'attribut HTML `<input accept="...">` */
  readonly accept: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Avertissement non bloquant associé à un résultat de validation */
export interface UploadWarning {
  readonly code: string;
  readonly message: string;
}

/**
 * Résultat d'une validation de fichier contre la politique d'upload.
 *
 * Phase 1.1 : champs enrichis ajoutés (tous optionnels — rétrocompatible).
 * Les champs Phase 1 `valid`, `errorCode`, `message` restent inchangés.
 */
export interface UploadValidationResult {
  // ─── Phase 1 (stable) ────────────────────────────────────────────────────
  readonly valid: boolean;
  readonly errorCode?: UploadErrorCode;
  readonly message?: string;
  // ─── Phase 1.1 (enrichi, optionnel) ──────────────────────────────────────
  readonly status?: UploadValidationStatus;
  readonly normalizedMime?: string;
  readonly normalizedExtension?: string;
  readonly policyVersion?: string;
  readonly errorCategory?: UploadErrorCategory;
  readonly warnings?: UploadWarning[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Descripteur minimal requis pour la validation de politique d'upload.
 * Compatible avec l'objet natif `File` (subset de ses propriétés).
 */
export interface UploadFileDescriptor {
  /** MIME type tel que rapporté par le navigateur (peut être vide "") */
  readonly type: string;
  /** Nom du fichier incluant l'extension */
  readonly name: string;
  /** Taille en octets */
  readonly size: number;
}
