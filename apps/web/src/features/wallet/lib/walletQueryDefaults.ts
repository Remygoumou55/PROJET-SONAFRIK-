import type { PaymentIntent, RoyaltyCalculation, Transaction } from "@sonafrik/types";

/** Références stables — évite re-fetch infini si passées à useLiveQuery.initialData. */
export const EMPTY_WALLET_TRANSACTIONS: Transaction[] = [];
export const EMPTY_WALLET_WITHDRAWALS: import("@sonafrik/types").Withdrawal[] = [];
export const EMPTY_WALLET_ROYALTIES: RoyaltyCalculation[] = [];
export const EMPTY_PAYMENT_INTENTS: PaymentIntent[] = [];
