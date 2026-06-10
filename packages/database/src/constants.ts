export const DATABASE_DOMAINS = [
  "identity",
  "creator",
  "streaming",
  "rights",
  "wallet",
  "admin",
] as const;

export type DatabaseDomain = (typeof DATABASE_DOMAINS)[number];

export const MVP_TABLE_COUNT = 37;

export const SPRINT2_TABLES = [
  "profiles",
  "roles",
  "permissions",
  "role_permissions",
  "user_roles",
  "user_sessions",
  "audit_logs",
] as const;

export const SPRINT4_TABLES = [
  "creators",
  "creator_roles",
  "artist_profiles",
  "labels",
  "label_members",
  "studios",
  "creator_verifications",
] as const;

export const SPRINT5_TABLES = [
  "genres",
  "albums",
  "album_genres",
  "tracks",
  "track_genres",
  "track_files",
] as const;
