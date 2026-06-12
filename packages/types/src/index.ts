/** Types partagés SONAFRIK */

export type UserRole = "auditeur" | "artiste" | "auditeur_artiste" | "admin";

export type AccountType = "auditeur" | "artiste" | "auditeur_artiste";

export type SessionPlatform = "web" | "ios" | "android";

export type SubscriptionTier =
  | "gratuit"
  | "journalier"
  | "hebdomadaire"
  | "mensuel"
  | "annuel"
  | "diaspora";

export type ArtistTier = "emergent" | "croissance" | "etabli";

export interface SonafrikBrand {
  name: "SONAFRIK";
  slogan: "NOTRE BIEN COMMUN";
  secondarySignature: "Écoute · Participe · Prospère";
}

export const SONAFRIK_BRAND: SonafrikBrand = {
  name: "SONAFRIK",
  slogan: "NOTRE BIEN COMMUN",
  secondarySignature: "Écoute · Participe · Prospère",
};

export interface Profile {
  id: string;
  phone: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  bio: string | null;
  city: string | null;
  country_code: string | null;
  account_type: AccountType | null;
  locale: string;
  fraud_score: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type NotificationCategory = "system" | "social" | "artist" | "billing" | "security";
export type NotificationPriority = "low" | "normal" | "high";
export type AppLanguage = "fr" | "en";
export type AudioQualityPreference = "64" | "128" | "256" | "auto";
export type ProfileVisibility = "public" | "private";

export interface UserPreferences {
  user_id: string;
  language: AppLanguage;
  audio_quality: AudioQualityPreference;
  data_saver: boolean;
  autoplay_on_wifi: boolean;
  autoplay_on_cellular: boolean;
  explicit_content_allowed: boolean;
  profile_visibility: ProfileVisibility;
  show_listening_activity: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  marketing_notifications: boolean;
  awards_reminders: boolean;
  new_releases_alerts: boolean;
  artist_comment_replies: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  action_url: string | null;
  read_at: string | null;
  priority: NotificationPriority;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface IdentityContext {
  profile: Profile;
  preferences: UserPreferences;
  roles: UserRole[];
  unreadNotifications: number;
  activeSessions: number;
}

export interface Role {
  id: string;
  name: UserRole;
  description: string | null;
}

export interface UserSession {
  id: string;
  user_id: string;
  device_id: string | null;
  device_name: string | null;
  platform: SessionPlatform | null;
  ip_address: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  last_active_at: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const ACCOUNT_TYPE_OPTIONS: {
  value: AccountType;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    value: "auditeur",
    label: "Auditeur",
    emoji: "🎧",
    description: "Écouter de la musique",
  },
  {
    value: "artiste",
    label: "Artiste",
    emoji: "🎤",
    description: "Publier ma musique",
  },
  {
    value: "auditeur_artiste",
    label: "Les deux",
    emoji: "🎧🎤",
    description: "Écouter ET publier",
  },
];

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_phone: "Numéro de téléphone invalide. Utilisez le format +224XXXXXXXXX.",
  invalid_otp: "Code de vérification invalide. Entrez 6 chiffres.",
  otp_expired: "Code expiré. Demandez un nouveau code.",
  otp_invalid: "Code incorrect. Vérifiez le SMS reçu.",
  session_expired: "Session expirée. Reconnectez-vous.",
  unauthorized: "Accès non autorisé.",
  profile_not_found: "Profil introuvable.",
  onboarding_required: "Complétez votre inscription pour continuer.",
  account_type_required: "Choisissez comment utiliser SONAFRIK.",
  network_error: "Erreur réseau. Vérifiez votre connexion.",
  unknown: "Une erreur est survenue. Réessayez.",
};

export const IDENTITY_ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Accès non autorisé. Connectez-vous.",
  profile_not_found: "Profil introuvable.",
  preferences_not_found: "Préférences introuvables.",
  invalid_profile_data: "Données de profil invalides.",
  invalid_preferences: "Préférences invalides.",
  avatar_upload_failed: "Échec du téléversement de l'avatar.",
  avatar_type_invalid: "Format d'image non supporté. Utilisez JPEG, PNG ou WebP.",
  notification_not_found: "Notification introuvable.",
  session_not_found: "Session introuvable.",
  account_delete_failed: "Impossible de supprimer le compte.",
  unknown: "Une erreur est survenue. Réessayez.",
};

export const LANGUAGE_OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

export const AUDIO_QUALITY_OPTIONS: { value: AudioQualityPreference; label: string }[] = [
  { value: "auto", label: "Automatique (réseau)" },
  { value: "64", label: "64 kbps — Mode 2G" },
  { value: "128", label: "128 kbps — Standard" },
  { value: "256", label: "256 kbps — Premium" },
];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  system: "Système",
  social: "Social",
  artist: "Artiste",
  billing: "Facturation",
  security: "Sécurité",
};

// ---------------------------------------------------------------------------
// Creator OS — Sprint 4
// ---------------------------------------------------------------------------

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

export const CREATOR_TEAM_ROLE_LABELS: Record<CreatorTeamRole, string> = {
  owner: "Propriétaire",
  manager: "Manager",
  editor: "Éditeur",
  accountant: "Comptable",
  viewer: "Lecteur",
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  draft: "Brouillon",
  pending: "En cours",
  approved: "Approuvée",
  rejected: "Rejetée",
};

export const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  identity: "Identité",
  artist: "Artiste",
  label: "Label",
};

export const CREATOR_ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Accès non autorisé. Connectez-vous.",
  not_artist_account: "Compte non éligible au Creator OS. Inscrivez-vous comme artiste.",
  creator_not_found: "Espace créateur introuvable.",
  invalid_artist_profile: "Données artiste invalides.",
  invalid_label: "Données label invalides.",
  invalid_team_member: "Membre d'équipe invalide.",
  verification_not_found: "Vérification introuvable.",
  verification_submit_failed: "Impossible de soumettre la vérification.",
  asset_upload_failed: "Échec du téléversement de l'asset.",
  asset_type_invalid: "Format de fichier non supporté.",
  label_not_found: "Label introuvable.",
  team_member_not_found: "Membre introuvable.",
  unknown: "Une erreur est survenue. Réessayez.",
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

// ---------------------------------------------------------------------------
// Catalog OS — Sprint 5
// ---------------------------------------------------------------------------

export type ReleaseType = "album" | "single" | "ep";
export type PublicationStatus = "draft" | "pending_review" | "published" | "rejected" | "archived";
export type TrackFileFormat = "mp3" | "aac" | "flac" | "wav";
export type CatalogAssetType = "audio" | "cover";

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

// ---------------------------------------------------------------------------
// Streaming OS — Sprint 6
// ---------------------------------------------------------------------------

export type StreamingPlatform = "web" | "ios" | "android";
export type StreamEventType = "play" | "pause" | "resume" | "seek" | "complete" | "skip" | "heartbeat";
export type FavoriteEntityType = "track" | "album" | "artist" | "playlist";
export type AudioQualityKbps = 64 | 128 | 256;

/** Real Listen V7.2 — seuil écoute valide */
export const REAL_LISTEN_THRESHOLD_PERCENT = 90;
/** Intervalle heartbeat (ms) */
export const STREAM_HEARTBEAT_INTERVAL_MS = 10_000;

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

export interface SearchResult {
  tracks: TrackWithMeta[];
  albums: AlbumWithMeta[];
  artists: ArtistResult[];
  total: number;
  query: string;
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

export const STREAMING_PERMISSIONS = {
  PLAY: "stream.play",
  PLAYLIST_CREATE: "stream.playlist.create",
  PLAYLIST_EDIT: "stream.playlist.edit",
  LIBRARY_MANAGE: "stream.library.manage",
  ANALYTICS_VIEW: "stream.analytics.view",
} as const;

export const STREAMING_ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Accès non autorisé. Connectez-vous.",
  no_streaming_permission: "Abonnement requis pour écouter de la musique.",
  track_not_found: "Morceau introuvable.",
  session_not_found: "Session d'écoute introuvable.",
  session_expired: "Session expirée. Relancez la lecture.",
  stream_start_failed: "Impossible de démarrer la lecture.",
  stream_url_expired: "Lien audio expiré. Relancez la lecture.",
  playlist_not_found: "Playlist introuvable.",
  playlist_create_failed: "Impossible de créer la playlist.",
  favorite_toggle_failed: "Impossible de modifier les favoris.",
  search_failed: "Recherche indisponible. Réessayez.",
  analytics_failed: "Impossible de charger les statistiques.",
  unknown: "Une erreur est survenue. Réessayez.",
};

export const STREAMING_ERROR_LABELS: Record<string, string> = STREAMING_ERROR_MESSAGES;

// ---------------------------------------------------------------------------
// Recommendation OS — Sprint 5.1
// ---------------------------------------------------------------------------

export type RecommendationWindow = 'today' | '7d' | '30d';
export type RecommendationReason = 'genre_affinity' | 'collaborative' | 'new_release' | 'trending';

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

export const RECOMMENDATION_ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Accès non autorisé. Connectez-vous.",
  trending_failed: "Impossible de charger les tendances.",
  similar_failed: "Impossible de charger les morceaux similaires.",
  recommendations_failed: "Impossible de charger les recommandations.",
  unknown: "Une erreur est survenue. Réessayez.",
};

// ---------------------------------------------------------------------------
// Wallet OS — Sprint 8
// CDC Règle #2 : Premium J1 · Gratuit 7 jours
// CDC Règle #3 : Revenue Pool 65% aux artistes
// CDC Règle #5 : Pourboire commission 5% invisible UI
// ---------------------------------------------------------------------------

export const PREMIUM_GRACE_PERIOD_DAYS = 7;
export const REVENUE_POOL_PERCENT = 65;
export const TIP_COMMISSION_PERCENT = 5;

export const SUBSCRIPTION_PLANS = {
  MONTHLY: { type: "monthly" as const, price_gnf: 50_000, label: "Mensuel", duration_days: 30 },
  ANNUAL: { type: "annual" as const, price_gnf: 480_000, label: "Annuel", duration_days: 365 },
} as const;

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;
export type PayoutAccountType = "orange_money" | "mtn_momo" | "wave" | "bank_transfer";
export type TransactionType = "topup" | "subscription" | "tip" | "beat_purchase" | "withdrawal" | "royalty_payout" | "refund";
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled" | "refunded";
export type WithdrawalStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
export type WalletLedgerReason = "topup" | "subscription" | "royalty" | "tip" | "refund" | "withdrawal" | "commission";
export type RoyaltyCycleStatus = "open" | "calculating" | "ready" | "distributed" | "closed";
export type RoyaltyCalculationStatus = "pending" | "approved" | "paid" | "cancelled";

export interface Wallet {
  id: string;
  user_id: string;
  balance_gnf: number;
  currency: string;
  total_credited_gnf: number;
  total_debited_gnf: number;
  created_at: string;
  updated_at: string;
}

export interface WalletLedgerEntry {
  id: string;
  wallet_id: string;
  user_id: string;
  entry_type: "credit" | "debit";
  amount_gnf: number;
  balance_after_gnf: number;
  reason: WalletLedgerReason;
  reference_id: string | null;
  reference_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount_gnf: number;
  commission_gnf: number;
  net_amount_gnf: number;
  currency: string;
  payment_method: PayoutAccountType | "card" | "internal" | null;
  payment_reference: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  wallet_id: string;
  payout_account_id: string;
  amount_gnf: number;
  fee_gnf: number;
  net_amount_gnf: number;
  status: WithdrawalStatus;
  reference: string | null;
  rejection_reason: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutAccount {
  id: string;
  user_id: string;
  type: PayoutAccountType;
  is_default: boolean;
  verified: boolean;
  display_name: string;
  phone_number: string | null;
  iban: string | null;
  bank_name: string | null;
  account_holder_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RoyaltyCycle {
  id: string;
  period_start: string;
  period_end: string;
  status: RoyaltyCycleStatus;
  total_valid_listens: number;
  total_revenue_gnf: number;
  revenue_pool_gnf: number;
  revenue_pool_percent: number;
  artist_count: number;
  distributed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoyaltyCalculation {
  id: string;
  cycle_id: string;
  artist_id: string;
  creator_id: string | null;
  valid_listen_count: number;
  listen_share_percent: number;
  gross_amount_gnf: number;
  platform_commission_gnf: number;
  net_amount_gnf: number;
  status: RoyaltyCalculationStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletContext {
  wallet: Wallet;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  isInGracePeriod: boolean;
  recentTransactions: Transaction[];
  pendingWithdrawals: number;
}

export const PAYOUT_ACCOUNT_LABELS: Record<PayoutAccountType, string> = {
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
  wave: "Wave",
  bank_transfer: "Virement bancaire",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  topup: "Recharge",
  subscription: "Abonnement",
  tip: "Pourboire",
  beat_purchase: "Achat beat",
  withdrawal: "Retrait",
  royalty_payout: "Royalties",
  refund: "Remboursement",
};

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: "En attente",
  processing: "En cours",
  completed: "Effectué",
  failed: "Échoué",
  cancelled: "Annulé",
};

export const WALLET_ERROR_MESSAGES: Record<string, string> = {
  wallet_not_found: "Portefeuille introuvable.",
  insufficient_balance: "Solde insuffisant.",
  payout_account_not_found: "Compte de retrait introuvable.",
  minimum_withdrawal_5000: "Le retrait minimum est de 5 000 GNF.",
  subscription_failed: "Impossible de souscrire. Vérifiez votre solde.",
  topup_failed: "Échec de la recharge. Réessayez.",
  withdrawal_failed: "Impossible d'initier le retrait.",
  payout_account_create_failed: "Impossible d'ajouter le compte de retrait.",
  unauthorized: "Accès non autorisé.",
  unknown: "Une erreur est survenue. Réessayez.",
};
