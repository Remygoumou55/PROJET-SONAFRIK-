/** SONAFRIK — Domaine Creator (Artiste, Label, Équipe, Vérification, Analytics) */

import type { Profile } from "./identity";
import type { CreatorRoyaltyHistoryEntry } from "./wallet";

export type ArtistTier = "emergent" | "croissance" | "etabli";
export type CreatorStatus = "draft" | "active" | "suspended";
export type CreatorTeamRole = "owner" | "manager" | "editor" | "accountant" | "viewer";
export type LabelMemberRole = "owner" | "admin" | "a_and_r" | "member";
export type VerificationType = "identity" | "artist" | "label";
export type VerificationStatus = "draft" | "pending" | "approved" | "rejected";
export type VerificationDocumentType = "national_id" | "passport" | "business_license" | "other";
export type CreatorAssetKind = "banner" | "cover" | "verification" | "label_logo";

export interface Creator {
  id: string;
  owner_id: string;
  label_id: string | null;
  status: CreatorStatus;
  tier: ArtistTier;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ArtistProfile {
  creator_id: string;
  stage_name: string;
  slug: string;
  bio: string | null;
  genres: string[];
  banner_path: string | null;
  cover_path: string | null;
  social_links: Record<string, string>;
  is_public: boolean;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  description: string | null;
  logo_path: string | null;
  country_code: string;
  website_url: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreatorTeamMember {
  id: string;
  creator_id: string;
  member_id: string;
  role: CreatorTeamRole;
  invited_by: string | null;
  accepted_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  profile?: Pick<Profile, "full_name" | "phone" | "avatar_url">;
}

export interface LabelMember {
  label_id: string;
  member_id: string;
  role: LabelMemberRole;
  invited_by: string | null;
  joined_at: string;
  profile?: Pick<Profile, "full_name" | "phone">;
}

export interface Studio {
  id: string;
  creator_id: string;
  name: string;
  city: string;
  country_code: string;
  address: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreatorVerification {
  id: string;
  creator_id: string;
  label_id: string | null;
  verification_type: VerificationType;
  status: VerificationStatus;
  document_type: VerificationDocumentType | null;
  document_path: string | null;
  rejection_reason: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatorContext {
  creator: Creator;
  artistProfile: ArtistProfile;
  teamCount: number;
  labelCount: number;
  pendingVerifications: number;
  studios: Studio[];
}

// ─── Creator Analytics ────────────────────────────────────────────────────────

export interface CreatorStreamStats {
  total_streams: number;
  valid_streams: number;
  fraud_streams: number;
  today_streams: number;
  week_streams: number;
  month_streams: number;
  quarter_streams: number;
  valid_week_streams: number;
  valid_month_streams: number;
  valid_rate_percent: number;
}

export interface StreamTimelineEntry {
  date: string;
  streams: number;
  valid_streams: number;
}

export interface CreatorTopTrack {
  track_id: string;
  title: string;
  slug: string;
  album_id: string | null;
  album_title: string | null;
  cover_path: string | null;
  duration_seconds: number | null;
  valid_streams: number;
  total_streams: number;
  like_count: number;
  engagement_score: number;
}

export interface CreatorTopAlbum {
  album_id: string;
  title: string;
  slug: string;
  cover_path: string | null;
  release_type: string;
  release_date: string | null;
  track_count: number;
  valid_streams: number;
  total_streams: number;
  like_count: number;
  engagement_score: number;
}

export interface CreatorAudienceStats {
  total_followers: number;
  artist_followers: number;
  creator_followers: number;
  new_followers_7d: number;
  new_followers_30d: number;
  total_track_likes: number;
  total_album_favorites: number;
  playlist_followers: number;
  total_engagement: number;
  engagement_score: number;
}

export interface CreatorRevenueStats {
  total_royalties_gnf: number;
  paid_royalties_gnf: number;
  pending_royalties_gnf: number;
  wallet_balance_gnf: number;
  total_credited_gnf: number;
  valid_listen_count: number;
  avg_gnf_per_listen: number;
  month_valid_streams: number;
  estimated_monthly_gnf: number;
}

export interface CreatorAnalyticsData {
  streamStats: CreatorStreamStats;
  timeline: StreamTimelineEntry[];
  topTracks: CreatorTopTrack[];
  topAlbums: CreatorTopAlbum[];
  audienceStats: CreatorAudienceStats;
  revenueStats: CreatorRevenueStats;
  royaltyHistory: CreatorRoyaltyHistoryEntry[];
}

// ─── Labels / Constantes ─────────────────────────────────────────────────────

export const CREATOR_TEAM_ROLE_LABELS: Record<CreatorTeamRole, string> = {
  owner:      "Propriétaire",
  manager:    "Manager",
  editor:     "Éditeur",
  accountant: "Comptable",
  viewer:     "Lecteur",
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  draft:    "Brouillon",
  pending:  "En cours",
  approved: "Approuvée",
  rejected: "Rejetée",
};

export const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  identity: "Identité",
  artist:   "Artiste",
  label:    "Label",
};

export const CREATOR_ERROR_MESSAGES: Record<string, string> = {
  unauthorized:               "Accès non autorisé. Connectez-vous.",
  not_artist_account:         "Compte non éligible au Creator OS. Inscrivez-vous comme artiste.",
  creator_not_found:          "Espace créateur introuvable.",
  invalid_artist_profile:     "Données artiste invalides.",
  invalid_label:              "Données label invalides.",
  invalid_team_member:        "Membre d'équipe invalide.",
  verification_not_found:     "Vérification introuvable.",
  verification_submit_failed: "Impossible de soumettre la vérification.",
  asset_upload_failed:        "Échec du téléversement de l'asset.",
  asset_type_invalid:         "Format de fichier non supporté.",
  label_not_found:            "Label introuvable.",
  team_member_not_found:      "Membre introuvable.",
  unknown:                    "Une erreur est survenue. Réessayez.",
};

export const GENRE_OPTIONS: string[] = [
  "Afrobeat",
  "Mandingue",
  "Rap GN",
  "Gospel",
  "Reggae",
  "Pop Africaine",
  "Traditionnel",
  "Autre",
];

export const ANALYTICS_ERROR_MESSAGES: Record<string, string> = {
  stream_stats_failed:    "Impossible de charger les statistiques de streams.",
  timeline_failed:        "Impossible de charger la timeline.",
  top_tracks_failed:      "Impossible de charger le top morceaux.",
  top_albums_failed:      "Impossible de charger le top albums.",
  audience_stats_failed:  "Impossible de charger les statistiques d'audience.",
  revenue_stats_failed:   "Impossible de charger les statistiques de revenus.",
  unauthorized:           "Accès non autorisé.",
  unknown:                "Une erreur est survenue.",
};

