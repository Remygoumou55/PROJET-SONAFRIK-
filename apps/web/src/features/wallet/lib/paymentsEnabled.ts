/** Portefeuille & paiements mobiles — flags env (Vague E / P0-2). */

/** Le portefeuille (solde, historique, royalties) est toujours visible. */
export function isWalletVisible(): boolean {
  return true;
}

/** Recharge opérateur (Orange, MTN, Wave) — nécessite credentials + TOPUP_ENABLED. */
export function isTopupEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
}

/** Retrait vers Mobile Money — même gate que les topups en Phase 1. */
export function isWithdrawalEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
}
