/** SONAFRIK — Domaine Payments (Paiements mobiles africains) */

export type PaymentProvider     = "orange_money_gn" | "mtn_momo_gn" | "wave_gn" | "soutra_money";
export type PaymentIntentStatus = "initiated" | "pending" | "confirmed" | "failed" | "expired" | "refunded";
export type PaymentPurpose      =
  | "topup"
  | "subscription_daily"
  | "subscription_weekly"
  | "subscription_monthly"
  | "subscription_yearly"
  | "subscription_diaspora";

export interface PaymentIntent {
  id:             string;
  user_id:        string;
  wallet_id:      string;
  provider:       PaymentProvider;
  purpose:        PaymentPurpose;
  amount_gnf:     number;
  currency:       string;
  provider_ref:   string | null;
  provider_phone: string;
  status:         PaymentIntentStatus;
  metadata:       Record<string, unknown>;
  initiated_at:   string;
  confirmed_at:   string | null;
  failed_at:      string | null;
  expires_at:     string;
  created_at:     string;
  updated_at:     string;
}

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  orange_money_gn: "Orange Money",
  mtn_momo_gn:     "MTN MoMo",
  wave_gn:         "Wave",
  soutra_money:    "Soutra Money",
};

export const PAYMENT_PROVIDER_ICONS: Record<PaymentProvider, string> = {
  orange_money_gn: "🟠",
  mtn_momo_gn:     "🟡",
  wave_gn:         "🌊",
  soutra_money:    "💰",
};

export const PAYMENT_INTENT_STATUS_LABELS: Record<PaymentIntentStatus, string> = {
  initiated: "Initié",
  pending:   "En attente",
  confirmed: "Confirmé",
  failed:    "Échoué",
  expired:   "Expiré",
  refunded:  "Remboursé",
};

export const PAYMENT_ERROR_MESSAGES: Record<string, string> = {
  intent_not_found:    "Intention de paiement introuvable.",
  expired:             "Le délai de paiement a expiré. Réessayez.",
  already_confirmed:   "Ce paiement a déjà été confirmé.",
  provider_error:      "Erreur opérateur. Réessayez.",
  insufficient_balance:"Solde insuffisant.",
  invalid_provider:    "Opérateur de paiement non supporté.",
  invalid_amount:      "Montant invalide.",
  unauthorized:        "Accès non autorisé.",
  unknown:             "Une erreur est survenue.",
};
