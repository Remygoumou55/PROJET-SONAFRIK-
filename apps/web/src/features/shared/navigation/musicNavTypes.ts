/** Icônes unifiées — une famille, stroke 1.75, taille 20px */
export type MusicNavIconName =
  | "home"
  | "search"
  | "library"
  | "wallet"
  | "profile"
  | "overview"
  | "publish"
  | "publications"
  | "analytics"
  | "settings"
  | "help"
  | "dashboard"
  | "users"
  | "artists"
  | "catalog"
  | "rights"
  | "revenue"
  | "withdrawals"
  | "beatstore"
  | "awards"
  | "audit"
  | "health"
  | "live"
  | "fraud"
  | "flags"
  | "account"
  | "security"
  | "notifications"
  | "payment"
  | "preferences"
  | "back";

export type MusicNavRole = "artist" | "listener" | "admin" | "governance";

export type MusicNavBadgeKind = "default" | "alert" | "live" | "pending";

export interface MusicNavItemConfig {
  href: string;
  label: string;
  icon: MusicNavIconName;
  exact?: boolean;
  badge?: number | string;
  badgeKind?: MusicNavBadgeKind;
  description?: string;
}

export interface MusicNavSectionConfig {
  title: string;
  items: MusicNavItemConfig[];
}

export type MusicNavEntry =
  | { type: "section"; label: string }
  | (MusicNavItemConfig & { type?: "link" });
