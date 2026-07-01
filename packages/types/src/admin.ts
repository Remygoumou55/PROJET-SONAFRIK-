/** SONAFRIK — Domaine Admin OS (Feature Flags, System Settings) */

export type SettingCategory = "streaming" | "wallet" | "creator" | "admin" | "general";

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string | null;
  metadata: Record<string, unknown>;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  category: SettingCategory;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SystemSettingAuditEntry = {
  id: string;
  settingKey: string;
  actorId: string | null;
  previousValue: unknown;
  newValue: unknown;
  motive: string | null;
  createdAt: string;
};

export const SETTING_CATEGORY_LABELS: Record<SettingCategory, string> = {
  streaming: "Streaming",
  wallet:    "Portefeuille",
  creator:   "Créateurs",
  admin:     "Administration",
  general:   "Général",
};

export const ADMIN_ERROR_MESSAGES: Record<string, string> = {
  unauthorized:      "Accès non autorisé.",
  flag_not_found:    "Feature flag introuvable.",
  setting_not_found: "Paramètre introuvable.",
  update_failed:     "Impossible de mettre à jour.",
  unknown:           "Une erreur est survenue.",
};

/** Statut compte auditeur (colonne profiles.account_status) */
export type AdminAccountStatus = "active" | "suspended" | "banned" | "deleted";

/** Tier créateur (colonne creators.tier) */
export type AdminCreatorTier = "emergent" | "croissance" | "etabli";

export type AdminUserListItem = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  country_code: string | null;
  is_premium: boolean;
  premium_expires_at: string | null;
  account_status: AdminAccountStatus;
  warning_count: number;
  last_warning_at: string | null;
  suspended_until: string | null;
  suspended_reason: string | null;
  fraud_score: number;
  created_at: string;
  last_seen_at: string | null;
  stream_sessions_count: number;
};

export type AdminArtistListItem = {
  creator_id: string;
  artist_profile_id: string;
  stage_name: string;
  genres: string[];
  profile_photo: string | null;
  avatar_url: string | null;
  city: string | null;
  tier: AdminCreatorTier;
  creator_status: string;
  verified: boolean;
  verification_status: "none" | "draft" | "pending" | "approved" | "rejected";
  pending_verification_id: string | null;
  owner_id: string;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
  owner_account_status: AdminAccountStatus;
  creator_score: number;
  total_streams: number;
  tracks_count: number;
  albums_count: number;
  created_at: string;
};

export type AdminUsersListResult = {
  users: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminArtistsListResult = {
  artists: AdminArtistListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminUsersFilter = "all" | "premium" | "suspended" | "new";

export type AdminArtistsFilter = "all" | "pending" | "verified" | "tier_etabli" | "suspended";

/** Badges navigation admin (LDSE) */
export type AdminNavBadges = {
  content: number;
  pendingRightsClaims: number;
  fraudSessions: number;
  withdrawals: number;
};

/** Métriques fraude admin — SSOT dashboard + page fraude */
export type AdminFraudMetrics = {
  totalFlagged: number;
  flaggedThisMonth: number;
  flaggedToday: number;
};

/** Comptages modération admin */
export type AdminModerationMetrics = {
  pendingAlbums: number;
  pendingTracks: number;
  pendingCatalog: number;
  pendingWithdrawals: number;
  pendingRightsClaims: number;
  pendingArtistVerifications: number;
};

/** Comptages utilisateurs admin */
export type AdminUserMetrics = {
  totalUsers: number;
  premiumUsers: number;
  newUsersToday: number;
  activeArtists: number;
  newArtistsThisWeek: number;
};

/** Snapshot admin synchronisé (LDSE) */
export type AdminLiveSnapshot = {
  navBadges: AdminNavBadges;
  fraudMetrics: AdminFraudMetrics;
  moderationMetrics: AdminModerationMetrics;
  userMetrics: AdminUserMetrics;
  fetchedAt: string;
};
