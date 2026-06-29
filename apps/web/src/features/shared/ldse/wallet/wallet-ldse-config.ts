/** Clés cache LDSE — wallet / royalties (session utilisateur unique). */
export const WALLET_LDSE_KEYS = {
  pageData: "wallet:page-data",
  royalties: "wallet:royalties",
  payoutPage: "wallet:payout-page",
  transactions: "wallet:transactions",
} as const;

export const WALLET_LDSE_EVENTS = {
  topupCompleted: "wallet.topup.completed",
  withdrawalRequested: "wallet.withdrawal.requested",
  subscriptionChanged: "wallet.subscription.changed",
  invalidate: "wallet.invalidate",
} as const;
