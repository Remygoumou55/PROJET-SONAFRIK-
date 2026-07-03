/**
 * SONAFRIK — Upload Policy Enterprise
 * Enums officiels pour toute la logique d'upload.
 * Source unique de vérité pour les catégories, formats, contextes et codes d'erreur.
 */

/** Catégories d'assets uploadables sur SONAFRIK */
export enum UploadCategory {
  AUDIO    = "audio",
  IMAGE    = "image",
  DOCUMENT = "document",
}

/** Formats audio officiellement supportés */
export enum AudioFormat {
  MP3 = "mp3",
  M4A = "m4a",
  WAV = "wav",
}

/** Formats image officiellement supportés */
export enum ImageFormat {
  JPEG = "jpeg",
  JPG  = "jpg",
  PNG  = "png",
  WEBP = "webp",
}

/** Formats document officiellement supportés */
export enum DocumentFormat {
  PDF = "pdf",
}

/**
 * Contextes de stockage (asset kinds) dans SONAFRIK.
 * Chaque contexte mappe à un bucket Supabase ou un chemin spécifique.
 */
export enum AssetKind {
  CATALOG_AUDIO    = "catalog_audio",
  CATALOG_COVER    = "catalog_cover",
  ARTIST_AVATAR    = "artist_avatar",
  ARTIST_BANNER    = "artist_banner",
  ARTIST_COVER     = "artist_cover",
  ARTIST_GALLERY   = "artist_gallery",
  ARTIST_LABEL_LOGO = "artist_label_logo",
  VERIFICATION_DOC = "verification_doc",
}

/** Codes d'erreur standardisés pour les échecs de validation upload */
export enum UploadErrorCode {
  FORMAT_NOT_ALLOWED = "FORMAT_NOT_ALLOWED",
  SIZE_EXCEEDED      = "SIZE_EXCEEDED",
  MIME_MISMATCH      = "MIME_MISMATCH",
  FILE_EMPTY         = "FILE_EMPTY",
  FILE_TOO_SMALL     = "FILE_TOO_SMALL",
  UNKNOWN_FORMAT     = "UNKNOWN_FORMAT",
  DURATION_INVALID   = "DURATION_INVALID",
  NEEDS_TRANSCODING  = "NEEDS_TRANSCODING",
  INTEGRITY_FAILED   = "INTEGRITY_FAILED",
}
