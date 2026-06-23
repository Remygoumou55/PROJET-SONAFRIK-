/** SONAFRIK — Domaine Streaming (Player, Playlists, Search, Discovery, Recommendations) */

import type { Track, Album } from "./catalog";
import type { BeatLicenseType } from "./beats";

export type StreamingPlatform  = "web" | "ios" | "android";
export type StreamEventType    = "play" | "pause" | "resume" | "seek" | "complete" | "skip" | "heartbeat";
export type FavoriteEntityType = "track" | "album" | "artist" | "playlist";
export type AudioQualityKbps   = 64 | 96 | 128 | 256;
export type SearchType         = "all" | "tracks" | "artists" | "albums" | "playlists" | "beats";
export type RecommendationWindow = "today" | "7d" | "30d";
export type RecommendationReason = "genre_affinity" | "collaborative" | "new_release" | "trending";
export type DiscoverySection   = "pour_vous" | "decouvertes" | "tendances" | "nouveautes" | "artistes" | "albums";
export type NewReleasesType    = "track" | "album" | "artist" | "all";

export interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_path: string | null;
  is_public: boolean;
  track_count: number;
  total_duration_seconds: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PlaylistTrack {
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
  added_by: string | null;
  track?: Track;
}

export interface Favorite {
  user_id: string;
  entity_type: FavoriteEntityType;
  entity_id: string;
  created_at: string;
}

export interface StreamSession {
  id: string;
  user_id: string;
  track_id: string;
  track_file_id: string | null;
  device_id: string | null;
  platform: StreamingPlatform;
  quality_kbps: number | null;
  started_at: string;
  last_heartbeat_at: string;
  completed_at: string | null;
  total_listened_seconds: number;
  total_duration_seconds: number;
  listen_percentage: number;
  is_valid_listen: boolean;
  fraud_flags: string[];
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreamEvent {
  id: string;
  session_id: string;
  user_id: string;
  track_id: string;
  event_type: StreamEventType;
  position_seconds: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PlaybackPosition {
  user_id: string;
  track_id: string;
  position_seconds: number;
  updated_at: string;
}

export interface StreamStartResult {
  sessionId: string;
  signedUrl: string;
  expiresAt: string;
  durationSeconds: number;
}

export interface TrackWithMeta extends Track {
  artist_name?: string;
  album_title?: string;
  cover_url?: string | null;
  is_favorited?: boolean;
}

export interface AlbumWithMeta extends Album {
  artist_name?: string;
  cover_url?: string | null;
  track_count?: number;
  is_favorited?: boolean;
}

export interface ArtistResult {
  creator_id: string;
  stage_name: string;
  slug: string;
  bio: string | null;
  genres: string[];
  cover_path: string | null;
  verified: boolean;
}

export interface PlaylistSearchResult {
  id: string;
  title: string;
  description: string | null;
  cover_path: string | null;
  track_count: number;
  is_public: boolean;
}

export interface BeatSearchResult {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  genre: string | null;
  cover_path: string | null;
  price_gnf: number;
  bpm: number | null;
  license_type: BeatLicenseType;
}

export interface SearchResult {
  tracks: TrackWithMeta[];
  albums: AlbumWithMeta[];
  artists: ArtistResult[];
  playlists: PlaylistSearchResult[];
  beats: BeatSearchResult[];
  total: number;
  query: string;
  type: SearchType;
}

export interface StreamAnalytics {
  creator_id: string;
  period_days: number;
  total_streams: number;
  valid_streams: number;
  unique_listeners: number;
  total_listened_seconds: number;
  top_tracks: { track_id: string; title: string; stream_count: number }[];
  streams_by_platform: Record<StreamingPlatform, number>;
}

export interface LibraryItem {
  entity_type: FavoriteEntityType;
  entity_id: string;
  created_at: string;
  track?: TrackWithMeta;
  album?: AlbumWithMeta;
  playlist?: Playlist;
}

export interface PlayerState {
  currentTrack: TrackWithMeta | null;
  sessionId: string | null;
  signedUrl: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentPosition: number;
  duration: number;
  volume: number;
  platform: StreamingPlatform;
  quality: AudioQualityKbps;
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export interface TrendingTrack {
  track_id: string;
  title: string;
  slug: string;
  duration_seconds: number | null;
  artist_name: string | null;
  creator_id: string;
  album_id: string | null;
  album_title: string | null;
  cover_path: string | null;
  listen_count: number;
  unique_listeners: number;
  trending_score: number;
}

export interface SimilarTrack {
  track_id: string;
  title: string;
  slug: string;
  duration_seconds: number | null;
  artist_name: string | null;
  creator_id: string;
  album_id: string | null;
  album_title: string | null;
  cover_path: string | null;
  similarity_score: number;
  similarity_reasons: string[];
}

export interface RecommendedTrack {
  track_id: string;
  title: string;
  slug: string;
  duration_seconds: number | null;
  artist_name: string | null;
  creator_id: string;
  album_id: string | null;
  album_title: string | null;
  cover_path: string | null;
  recommendation_score: number;
  reason: RecommendationReason;
}

// ─── Discovery ────────────────────────────────────────────────────────────────

export interface DiscoveryTrack {
  track_id: string;
  title: string;
  slug: string;
  duration_seconds: number | null;
  artist_name: string | null;
  creator_id: string;
  album_id: string | null;
  album_title: string | null;
  cover_path: string | null;
  published_at: string | null;
  like_count: number;
  stream_count: number;
  discovery_score: number;
}

export interface DiscoveryAlbum {
  id: string;
  title: string;
  slug: string;
  release_type: string;
  cover_path: string | null;
  release_date: string | null;
  artist_name: string | null;
  creator_id: string;
  published_at: string | null;
  like_count: number;
  stream_count: number;
  discovery_score: number;
}

export interface DiscoveryArtist {
  creator_id: string;
  stage_name: string;
  slug: string;
  bio: string | null;
  genres: string[];
  cover_path: string | null;
  verified: boolean;
  follower_count: number;
  stream_count: number;
  discovery_score: number;
  created_at?: string;
}

export interface NewReleasesResult {
  tracks: DiscoveryTrack[];
  albums: DiscoveryAlbum[];
  artists: DiscoveryArtist[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

export const STREAMING_PERMISSIONS = {
  PLAY:             "stream.play",
  PLAYLIST_CREATE:  "stream.playlist.create",
  PLAYLIST_EDIT:    "stream.playlist.edit",
  LIBRARY_MANAGE:   "stream.library.manage",
  ANALYTICS_VIEW:   "stream.analytics.view",
} as const;

export const STREAMING_ERROR_MESSAGES: Record<string, string> = {
  unauthorized:           "Accès non autorisé. Connectez-vous.",
  no_streaming_permission:"Abonnement requis pour écouter de la musique.",
  track_not_found:        "Morceau introuvable.",
  session_not_found:      "Session d'écoute introuvable.",
  session_expired:        "Session expirée. Relancez la lecture.",
  stream_start_failed:    "Impossible de démarrer la lecture.",
  stream_progress_failed:   "Impossible d'enregistrer la progression.",
  stream_complete_failed:   "Impossible de finaliser la lecture.",
  invalid_session:          "Session d'écoute invalide.",
  stream_url_expired:     "Lien audio expiré. Relancez la lecture.",
  playlist_not_found:     "Playlist introuvable.",
  playlist_create_failed: "Impossible de créer la playlist.",
  favorite_toggle_failed: "Impossible de modifier les favoris.",
  search_failed:          "Recherche indisponible. Réessayez.",
  analytics_failed:       "Impossible de charger les statistiques.",
  unknown:                "Une erreur est survenue. Réessayez.",
};

export const STREAMING_ERROR_LABELS: Record<string, string> = STREAMING_ERROR_MESSAGES;

export const RECOMMENDATION_ERROR_MESSAGES: Record<string, string> = {
  unauthorized:            "Accès non autorisé. Connectez-vous.",
  trending_failed:         "Impossible de charger les tendances.",
  similar_failed:          "Impossible de charger les morceaux similaires.",
  recommendations_failed:  "Impossible de charger les recommandations.",
  unknown:                 "Une erreur est survenue. Réessayez.",
};

export const DISCOVERY_ERROR_MESSAGES: Record<string, string> = {
  unauthorized:             "Accès non autorisé. Connectez-vous.",
  discovery_feed_failed:    "Impossible de charger les découvertes.",
  new_releases_failed:      "Impossible de charger les nouveautés.",
  suggested_artists_failed: "Impossible de charger les artistes suggérés.",
  suggested_albums_failed:  "Impossible de charger les albums suggérés.",
  unknown:                  "Une erreur est survenue. Réessayez.",
};
