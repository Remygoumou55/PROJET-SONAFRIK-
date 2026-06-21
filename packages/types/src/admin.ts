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
