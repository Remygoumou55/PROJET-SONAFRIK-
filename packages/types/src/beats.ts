/** SONAFRIK — Domaine Beats & Tips (Beat Store, Pourboires) */

export type TipStatus             = "pending" | "completed" | "failed" | "refunded";
export type BeatLicenseType       = "non_exclusive" | "exclusive" | "free";
export type BeatPublicationStatus = "draft" | "published" | "archived";

export interface Tip {
  id:             string;
  sender_id:      string;
  recipient_id:   string;
  amount_gnf:     number;
  commission_gnf: number;
  net_gnf:        number;
  message:        string | null;
  status:         TipStatus;
  created_at:     string;
}

export interface Beat {
  id:                 string;
  creator_id:         string;
  title:              string;
  slug:               string;
  description:        string | null;
  price_gnf:          number;
  bpm:                number | null;
  key:                string | null;
  genre:              string | null;
  tags:               string[];
  cover_path:         string | null;
  audio_preview_path: string | null;
  audio_full_path:    string | null;
  license_type:       BeatLicenseType;
  publication_status: BeatPublicationStatus;
  created_at:         string;
  updated_at:         string;
  deleted_at:         string | null;
}

export interface BeatPurchase {
  id:             string;
  buyer_id:       string;
  beat_id:        string;
  creator_id:     string;
  amount_gnf:     number;
  commission_gnf: number;
  net_gnf:        number;
  license_type:   BeatLicenseType;
  created_at:     string;
}

export interface LaunchProgress {
  current:      number;
  target:       number;
  percent:      number;
  launched:     boolean;
  artistCount:  number;
  trackCount:   number;
}

export const BEAT_LICENSE_LABELS: Record<BeatLicenseType, string> = {
  non_exclusive: "Licence non exclusive",
  exclusive:     "Licence exclusive",
  free:          "Gratuit",
};

export const TIP_STATUS_LABELS: Record<TipStatus, string> = {
  pending:   "En attente",
  completed: "Effectué",
  failed:    "Échoué",
  refunded:  "Remboursé",
};

export const TIPS_ERROR_MESSAGES: Record<string, string> = {
  unauthorized:         "Accès non autorisé.",
  insufficient_balance: "Solde insuffisant.",
  invalid_amount:       "Montant invalide.",
  receiver_not_found:   "Artiste introuvable.",
  self_tip:             "Vous ne pouvez pas vous envoyer un pourboire.",
  send_failed:          "Impossible d'envoyer le pourboire.",
  list_failed:          "Impossible de charger les pourboires.",
  unknown:              "Une erreur est survenue.",
};

export const BEATS_ERROR_MESSAGES: Record<string, string> = {
  unauthorized:         "Accès non autorisé.",
  beat_not_found:       "Beat introuvable.",
  already_purchased:    "Vous avez déjà acheté ce beat.",
  insufficient_balance: "Solde insuffisant.",
  create_failed:        "Impossible de créer le beat.",
  purchase_failed:      "Impossible d'acheter le beat.",
  list_failed:          "Impossible de charger les beats.",
  unknown:              "Une erreur est survenue.",
};
