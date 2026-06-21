/** SONAFRIK — Domaine Wallet (Portefeuille, Transactions, Royalties, Payout) */

export type PayoutAccountType = "orange_money" | "mtn_momo" | "wave" | "bank_transfer";
export type TransactionType = "topup" | "subscription" | "tip" | "beat_purchase" | "withdrawal" | "royalty_payout" | "refund";
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled" | "refunded";
export type WithdrawalStatus = "pending" | "approved" | "processing" | "completed" | "failed" | "cancelled";
export type WalletLedgerReason = "topup" | "subscription" | "royalty" | "tip" | "refund" | "withdrawal" | "commission";
export type RoyaltyCycleStatus = "open" | "calculating" | "ready" | "distributed" | "closed";
export type RoyaltyCalculationStatus = "pending" | "approved" | "paid" | "cancelled";
export type PayoutBatchStatus = "open" | "processing" | "completed" | "closed";

export const SUBSCRIPTION_PLANS = {
  MONTHLY: { type: "monthly" as const, price_gnf: 50_000, label: "Mensuel", duration_days: 30 },
  ANNUAL:  { type: "annual"  as const, price_gnf: 480_000, label: "Annuel", duration_days: 365 },
} as const;

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;

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

export interface RoyaltyCalculationResult {
  cycle_id: string;
  total_valid_listens: number;
  artist_count: number;
  revenue_pool_gnf: number;
  total_net_gnf: number;
  status: string;
}

export interface RoyaltyDistributionResult {
  cycle_id: string;
  distributed_count: number;
  total_gnf: number;
  status: string;
}

export interface RoyaltyCycleSummaryCalculation {
  calculation_id: string;
  artist_id: string;
  creator_id: string | null;
  valid_listen_count: number;
  listen_share_percent: number;
  net_amount_gnf: number;
  status: RoyaltyCalculationStatus;
  paid_at: string | null;
}

export interface RoyaltyCycleSummary {
  id: string;
  period_start: string;
  period_end: string;
  status: RoyaltyCycleStatus;
  total_revenue_gnf: number;
  revenue_pool_gnf: number;
  revenue_pool_percent: number;
  total_valid_listens: number;
  artist_count: number;
  distributed_at: string | null;
  calculations: RoyaltyCycleSummaryCalculation[];
}

export interface CreatorRoyaltyHistoryEntry {
  calculation_id: string;
  cycle_id: string;
  cycle_start: string;
  cycle_end: string;
  cycle_status: RoyaltyCycleStatus;
  calc_status: RoyaltyCalculationStatus;
  valid_listen_count: number;
  listen_share_percent: number;
  net_amount_gnf: number;
  paid_at: string | null;
  revenue_pool_gnf: number;
  total_valid_listens: number;
}

export interface ActiveRoyaltyCycle {
  id: string;
  period_start: string;
  period_end: string;
  status: RoyaltyCycleStatus;
  revenue_pool_percent: number;
  total_valid_listens: number;
  artist_count: number;
  distributed_at: string | null;
}

export interface PayoutBatch {
  id: string;
  name: string;
  status: PayoutBatchStatus;
  created_by: string;
  total_amount_gnf: number;
  withdrawal_count: number;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutAuditLog {
  id: string;
  withdrawal_id: string;
  action: "requested" | "approved" | "rejected" | "processing" | "paid" | "cancelled" | "batch_assigned";
  performed_by: string;
  previous_status: string | null;
  new_status: string;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserPayoutEntry {
  id: string;
  amount_gnf: number;
  fee_gnf: number;
  net_amount_gnf: number;
  status: WithdrawalStatus;
  reference: string | null;
  rejection_reason: string | null;
  created_at: string;
  processed_at: string | null;
  payout_account: {
    id: string;
    type: PayoutAccountType;
    display_name: string;
    phone_number: string | null;
  };
}

export interface PayoutSummary {
  total_withdrawn_gnf: number;
  pending_gnf: number;
  completed_count: number;
  pending_count: number;
  cancelled_count: number;
  total_fees_gnf: number;
}

export interface AdminPayoutEntry {
  id: string;
  user_id: string;
  amount_gnf: number;
  fee_gnf: number;
  net_amount_gnf: number;
  status: WithdrawalStatus;
  reference: string | null;
  rejection_reason: string | null;
  created_at: string;
  processed_at: string | null;
  batch_id: string | null;
  payout_account: {
    id: string;
    type: PayoutAccountType;
    display_name: string;
    phone_number: string | null;
    iban: string | null;
    bank_name: string | null;
    account_holder_name: string;
  };
  user_email: string | null;
}

export const PAYOUT_ACCOUNT_LABELS: Record<PayoutAccountType, string> = {
  orange_money: "Orange Money",
  mtn_momo:     "MTN MoMo",
  wave:         "Wave",
  bank_transfer:"Virement bancaire",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  topup:         "Recharge",
  subscription:  "Abonnement",
  tip:           "Pourboire",
  beat_purchase: "Achat beat",
  withdrawal:    "Retrait",
  royalty_payout:"Royalties",
  refund:        "Remboursement",
};

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending:    "En attente",
  approved:   "Approuvé",
  processing: "En cours",
  completed:  "Effectué",
  failed:     "Échoué",
  cancelled:  "Annulé",
};

export const WALLET_ERROR_MESSAGES: Record<string, string> = {
  wallet_not_found:             "Portefeuille introuvable.",
  insufficient_balance:         "Solde insuffisant.",
  payout_account_not_found:     "Compte de retrait introuvable.",
  minimum_withdrawal_5000:      "Le retrait minimum est de 5 000 GNF.",
  subscription_failed:          "Impossible de souscrire. Vérifiez votre solde.",
  topup_failed:                 "Échec de la recharge. Réessayez.",
  withdrawal_failed:            "Impossible d'initier le retrait.",
  payout_account_create_failed: "Impossible d'ajouter le compte de retrait.",
  unauthorized:                 "Accès non autorisé.",
  unknown:                      "Une erreur est survenue. Réessayez.",
};

export const ROYALTY_ENGINE_ERROR_MESSAGES: Record<string, string> = {
  cycle_not_found:      "Cycle de royalties introuvable.",
  cycle_open_failed:    "Impossible d'ouvrir un cycle de royalties.",
  cycle_overlap:        "Un cycle actif chevauche déjà cette période.",
  calculate_failed:     "Erreur lors du calcul des royalties.",
  distribute_failed:    "Erreur lors de la distribution des royalties.",
  history_failed:       "Impossible de charger l'historique des royalties.",
  active_cycle_failed:  "Impossible de charger le cycle actif.",
  unauthorized:         "Accès non autorisé.",
  unknown:              "Une erreur est survenue.",
};

export const PAYOUT_ENGINE_ERROR_MESSAGES: Record<string, string> = {
  withdrawal_not_found:                "Demande de retrait introuvable.",
  withdrawal_must_be_pending:          "Le retrait doit être en attente pour cette action.",
  withdrawal_must_be_approved:         "Le retrait doit être approuvé pour cette action.",
  withdrawal_must_be_processing:       "Le retrait doit être en cours de traitement.",
  withdrawal_must_be_pending_or_approved: "Le retrait doit être en attente ou approuvé.",
  cannot_cancel:                       "Impossible d'annuler ce retrait.",
  rejection_reason_required:           "Motif de rejet obligatoire.",
  payment_reference_required:          "Référence de paiement obligatoire.",
  batch_name_required:                 "Nom du lot obligatoire.",
  batch_not_found_or_closed:           "Lot introuvable ou fermé.",
  queue_failed:                        "Impossible de charger la file des retraits.",
  approve_failed:                      "Échec de l'approbation.",
  reject_failed:                       "Échec du rejet.",
  process_failed:                      "Échec du passage en traitement.",
  mark_paid_failed:                    "Échec de la validation de paiement.",
  cancel_failed:                       "Échec de l'annulation.",
  payouts_failed:                      "Impossible de charger vos retraits.",
  summary_failed:                      "Impossible de charger le récapitulatif.",
  unauthorized:                        "Accès non autorisé.",
  unknown:                             "Une erreur est survenue.",
};
