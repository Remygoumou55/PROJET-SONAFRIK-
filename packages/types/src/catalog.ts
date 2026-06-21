/** SONAFRIK — Domaine Catalog (Albums, Tracks, Genres, Crédits) */

export type ReleaseType = "album" | "single" | "ep";
export type PublicationStatus = "draft" | "pending_review" | "published" | "rejected" | "archived";
export type TrackFileFormat = "mp3" | "aac" | "flac" | "wav";
export type CatalogAssetType = "audio" | "cover";
export type TrackCreditRole =
  | "artiste_principal"
  | "featuring"
  | "auteur"
  | "compositeur"
  | "producteur"
  | "beatmaker"
  | "mixage"
  | "mastering";

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Album {
  id: string;
  creator_id: string;
  label_id: string | null;
  title: string;
  slug: string;
  release_type: ReleaseType;
  upc: string | null;
  description: string | null;
  cover_path: string | null;
  release_date: string | null;
  publication_status: PublicationStatus;
  rejection_reason: string | null;
  submitted_at: string | null;
  published_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Track {
  id: string;
  creator_id: string;
  album_id: string | null;
  title: string;
  slug: string;
  track_number: number;
  isrc: string | null;
  duration_seconds: number | null;
  explicit: boolean;
  language: string;
  bpm: number | null;
  musical_key: string | null;
  publication_status: PublicationStatus;
  rejection_reason: string | null;
  submitted_at: string | null;
  published_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TrackFile {
  id: string;
  track_id: string;
  format: TrackFileFormat;
  bitrate_kbps: number | null;
  file_path: string;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogContext {
  creatorId: string;
  albumsCount: number;
  singlesCount: number;
  tracksCount: number;
  pendingReview: number;
  publishedCount: number;
}

export interface TrackCredit {
  id: string;
  track_id: string;
  contributor_profile_id: string | null;
  contributor_name: string;
  role: TrackCreditRole;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TrackAppearance {
  trackId: string;
  trackTitle: string;
  albumId: string | null;
  coverUrl: string | null;
  mainArtistName: string;
  mainArtistCreatorId: string;
  creditRole: TrackCreditRole;
}

export const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  album: "Album",
  single: "Single",
  ep: "EP",
};

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  draft: "Brouillon",
  pending_review: "En revue",
  published: "Publié",
  rejected: "Rejeté",
  archived: "Archivé",
};

export const CATALOG_ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Accès non autorisé. Connectez-vous.",
  not_artist_account: "Compte non éligible au catalogue.",
  creator_not_found: "Espace créateur introuvable.",
  album_not_found: "Album introuvable.",
  track_not_found: "Morceau introuvable.",
  invalid_album: "Données album invalides.",
  invalid_track: "Données morceau invalides.",
  invalid_isrc: "Code ISRC invalide.",
  invalid_upc: "Code UPC invalide (12-14 chiffres).",
  publish_submit_failed: "Impossible de soumettre à publication.",
  asset_upload_failed: "Échec du téléversement de l'asset.",
  asset_type_invalid: "Format de fichier non supporté.",
  unknown: "Une erreur est survenue. Réessayez.",
};

export const TRACK_CREDIT_ROLE_LABELS: Record<TrackCreditRole, string> = {
  artiste_principal: "Artiste",
  featuring:         "Avec",
  auteur:            "Paroles",
  compositeur:       "Composition",
  producteur:        "Production",
  beatmaker:         "Beatmaker",
  mixage:            "Mixage",
  mastering:         "Mastering",
};

export const TRACK_CREDIT_ROLE_ORDER: TrackCreditRole[] = [
  "artiste_principal",
  "featuring",
  "auteur",
  "compositeur",
  "producteur",
  "beatmaker",
  "mixage",
  "mastering",
];
