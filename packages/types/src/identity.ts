/** SONAFRIK — Domaine Identity (Profile, Auth, Sessions, Notifications) */

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

export type NotificationType =
  | "stream_milestone"
  | "royalty_paid"
  | "verification_updated"
  | "rights_claim_updated"
  | "system";

export type AppLanguage = "fr" | "en";
export type AudioQualityPreference = "64" | "128" | "256" | "auto";
export type ProfileVisibility = "public" | "private";

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
  is_premium: boolean;
  premium_expires_at: string | null;
  role: "listener" | "artist" | "superadmin" | null;
  stage_name: string | null;
  main_genre: string | null;
  song_language: string | null;
  origin_region: string | null;
  orange_money_number: string | null;
  mtn_money_number: string | null;
  preferred_language: string | null;
  backup_email: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

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
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
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
  otp_send_failed: "Impossible d'envoyer le SMS. Réessayez dans quelques instants.",
  otp_rate_limited: "Trop de tentatives. Patientez avant de redemander un code.",
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

export const AUDIO_QUALITY_OPTIONS: {
  value: AudioQualityPreference;
  label: string;
  description: string;
}[] = [
  { value: "auto", label: "Automatique (recommandé)", description: "S'adapte à votre connexion" },
  { value: "256",  label: "Toujours haute qualité",   description: "128 kbps — maximum de données" },
  { value: "128",  label: "Standard fixe",            description: "96 kbps — équilibré" },
  { value: "64",   label: "Toujours économiser",       description: "64 kbps — minimum de données" },
];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  stream_milestone:     "Jalon d'écoutes",
  royalty_paid:         "Royalties",
  verification_updated: "Vérification",
  rights_claim_updated: "Droits",
  system:               "Système",
};

export const NOTIFICATION_ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Accès non autorisé.",
  list_failed:  "Impossible de charger les notifications.",
  mark_failed:  "Impossible de marquer comme lue.",
  unknown:      "Une erreur est survenue.",
};
