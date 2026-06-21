import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@sonafrik/database";
import type {
  Wallet,
  WalletLedgerEntry,
  Transaction,
  Withdrawal,
  PayoutAccount,
  RoyaltyCalculation,
  WalletContext,
} from "@sonafrik/types";
import { PREMIUM_GRACE_PERIOD_DAYS } from "@sonafrik/types";
import { WalletRepository } from "./wallet.repository";
import { WalletError } from "./errors";
import {
  subscribePremiumSchema,
  addPayoutAccountSchema,
  requestWithdrawalSchema,
  topupWalletSchema,
  type SubscribePremiumInput,
  type AddPayoutAccountInput,
  type RequestWithdrawalInput,
  type TopupWalletInput,
} from "./schemas";

export class WalletService {
  private readonly repo: WalletRepository;

  constructor(private readonly client: SupabaseClient<Database>) {
    this.repo = new WalletRepository(client);
  }

  private async requireUserId(): Promise<string> {
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error ?? !user) throw new WalletError("UNAUTHORIZED", "Non authentifié");
    return user.id;
  }

  async getWalletContext(): Promise<WalletContext> {
    const userId = await this.requireUserId();

    const [wallet, transactions] = await Promise.all([
      this.repo.getWallet(userId),
      this.repo.getTransactions(userId, 5),
    ]);

    if (!wallet) {
      throw new WalletError("WALLET_NOT_FOUND", "Portefeuille introuvable");
    }

    const { data: profile } = await this.client
      .from("profiles")
      .select("is_premium, premium_expires_at, created_at")
      .eq("id", userId)
      .single();

    // premium_expires_at doit être non-null et futur — null = jamais acheté, pas "illimité"
    const isPremium = !!(
      profile?.is_premium &&
      profile.premium_expires_at &&
      new Date(profile.premium_expires_at) > new Date()
    );

    const gracePeriodEnd = profile?.created_at
      ? new Date(new Date(profile.created_at).getTime() + PREMIUM_GRACE_PERIOD_DAYS * 86400_000)
      : null;
    const isInGracePeriod = gracePeriodEnd ? gracePeriodEnd > new Date() : false;

    const pendingWithdrawals = await this.repo.getWithdrawals(userId);
    const pendingCount = pendingWithdrawals.filter((w) => w.status === "pending").length;

    return {
      wallet,
      isPremium,
      premiumExpiresAt: profile?.premium_expires_at ?? null,
      isInGracePeriod,
      recentTransactions: transactions,
      pendingWithdrawals: pendingCount,
    };
  }

  async getWallet(): Promise<Wallet> {
    const userId = await this.requireUserId();
    const wallet = await this.repo.getWallet(userId);
    if (!wallet) throw new WalletError("WALLET_NOT_FOUND", "Portefeuille introuvable");
    return wallet;
  }

  async getBalance(): Promise<number> {
    const userId = await this.requireUserId();
    const { data } = await this.client.rpc("get_wallet_balance", { p_user_id: userId });
    return (data as number) ?? 0;
  }

  async getLedger(limit?: number, offset?: number): Promise<WalletLedgerEntry[]> {
    const userId = await this.requireUserId();
    return this.repo.getLedger(userId, limit, offset);
  }

  async getTransactions(limit?: number, offset?: number): Promise<Transaction[]> {
    const userId = await this.requireUserId();
    return this.repo.getTransactions(userId, limit, offset);
  }

  async getWithdrawals(): Promise<Withdrawal[]> {
    const userId = await this.requireUserId();
    return this.repo.getWithdrawals(userId);
  }

  async getPayoutAccounts(): Promise<PayoutAccount[]> {
    const userId = await this.requireUserId();
    return this.repo.getPayoutAccounts(userId);
  }

  async topupWallet(input: TopupWalletInput): Promise<{ transactionId: string; newBalanceGnf: number; idempotent: boolean }> {
    const parsed = topupWalletSchema.parse(input);
    await this.requireUserId();

    const { data, error } = await this.client.rpc("topup_wallet" as never, {
      p_amount_gnf: parsed.amountGnf,
      p_payment_method: parsed.paymentMethod,
      p_payment_reference: parsed.paymentReference,
    } as never);

    if (error) {
      if (error.message.includes("minimum_topup")) throw new WalletError("TOPUP_FAILED", "Recharge minimum 1 000 GNF");
      if (error.message.includes("wallet_not_found")) throw new WalletError("WALLET_NOT_FOUND", "Portefeuille introuvable");
      if (error.message.includes("invalid_payment_method")) throw new WalletError("TOPUP_FAILED", "Méthode de paiement invalide");
      throw new WalletError("TOPUP_FAILED", "Échec de la recharge");
    }

    const result = data as { success: boolean; transaction_id: string; new_balance_gnf: number; idempotent: boolean };
    return {
      transactionId: result.transaction_id,
      newBalanceGnf: result.new_balance_gnf,
      idempotent: result.idempotent,
    };
  }

  async subscribePremium(input: SubscribePremiumInput): Promise<{ expiresAt: string; amountDebitedGnf: number }> {
    const parsed = subscribePremiumSchema.parse(input);
    await this.requireUserId();

    const { data, error } = await this.client.rpc("subscribe_premium", {
      p_plan_type: parsed.planType,
    });

    if (error) {
      if (error.message.includes("insufficient_balance")) {
        throw new WalletError("INSUFFICIENT_BALANCE", "Solde insuffisant");
      }
      throw new WalletError("SUBSCRIPTION_FAILED", "Échec de la souscription");
    }

    const result = data as { success: boolean; expires_at: string; amount_debited_gnf: number };
    return { expiresAt: result.expires_at, amountDebitedGnf: result.amount_debited_gnf };
  }

  async addPayoutAccount(input: AddPayoutAccountInput): Promise<string> {
    const parsed = addPayoutAccountSchema.parse(input);
    await this.requireUserId();

    const { data, error } = await this.client.rpc("add_payout_account", {
      p_type: parsed.type,
      p_display_name: parsed.displayName,
      p_account_holder_name: parsed.accountHolderName,
      p_phone_number: parsed.phoneNumber ?? undefined,
      p_iban: parsed.iban ?? undefined,
      p_bank_name: parsed.bankName ?? undefined,
      p_is_default: parsed.isDefault,
    });

    if (error) throw new WalletError("ACCOUNT_CREATE_FAILED", "Impossible d'ajouter le compte");
    return data as string;
  }

  async requestWithdrawal(input: RequestWithdrawalInput): Promise<string> {
    const parsed = requestWithdrawalSchema.parse(input);
    await this.requireUserId();

    const { data, error } = await this.client.rpc("request_withdrawal", {
      p_payout_account_id: parsed.payoutAccountId,
      p_amount_gnf: parsed.amountGnf,
    });

    if (error) {
      if (error.message.includes("insufficient_balance")) {
        throw new WalletError("INSUFFICIENT_BALANCE", "Solde insuffisant");
      }
      if (error.message.includes("minimum_withdrawal")) {
        throw new WalletError("MINIMUM_WITHDRAWAL_5000", "Retrait minimum 5 000 GNF");
      }
      if (error.message.includes("payout_account_not_found")) {
        throw new WalletError("PAYOUT_ACCOUNT_NOT_FOUND", "Compte de retrait introuvable");
      }
      throw new WalletError("WITHDRAWAL_FAILED", "Échec du retrait");
    }
    return data as string;
  }

  async removePayoutAccount(accountId: string): Promise<void> {
    await this.requireUserId();
    await this.repo.softDeletePayoutAccount(accountId);
  }

  async getRoyaltyCalculations(): Promise<RoyaltyCalculation[]> {
    const userId = await this.requireUserId();
    return this.repo.getMyRoyaltyCalculations(userId);
  }
}

export function createWalletService(client: SupabaseClient<Database>): WalletService {
  return new WalletService(client);
}
