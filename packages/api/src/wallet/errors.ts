export type WalletErrorCode =
  | "WALLET_NOT_FOUND"
  | "INSUFFICIENT_BALANCE"
  | "PAYOUT_ACCOUNT_NOT_FOUND"
  | "MINIMUM_WITHDRAWAL_5000"
  | "SUBSCRIPTION_FAILED"
  | "TOPUP_FAILED"
  | "WITHDRAWAL_FAILED"
  | "ACCOUNT_CREATE_FAILED"
  | "UNAUTHORIZED";

export class WalletError extends Error {
  constructor(
    public readonly code: WalletErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "WalletError";
  }
}
