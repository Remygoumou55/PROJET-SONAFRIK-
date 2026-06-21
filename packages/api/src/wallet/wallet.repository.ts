import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@sonafrik/database";
import type {
  Wallet,
  WalletLedgerEntry,
  Transaction,
  Withdrawal,
  PayoutAccount,
  RoyaltyCycle,
  RoyaltyCalculation,
} from "@sonafrik/types";

export class WalletRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getWallet(userId: string): Promise<Wallet | null> {
    const { data, error } = await this.client
      .from("wallets" as never)
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data ? (data as unknown as Wallet) : null;
  }

  async getLedger(userId: string, limit = 20, offset = 0): Promise<WalletLedgerEntry[]> {
    const { data, error } = await this.client
      .from("wallet_ledger" as never)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data as WalletLedgerEntry[]) ?? [];
  }

  async getTransactions(userId: string, limit = 20, offset = 0): Promise<Transaction[]> {
    const { data, error } = await this.client
      .from("transactions" as never)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data as Transaction[]) ?? [];
  }

  async getWithdrawals(userId: string): Promise<Withdrawal[]> {
    const { data, error } = await this.client
      .from("withdrawals" as never)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data as Withdrawal[]) ?? [];
  }

  async getPayoutAccounts(userId: string): Promise<PayoutAccount[]> {
    const { data, error } = await this.client
      .from("payout_accounts" as never)
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("is_default", { ascending: false });
    if (error) throw error;
    return (data as PayoutAccount[]) ?? [];
  }

  async getRoyaltyCycles(): Promise<RoyaltyCycle[]> {
    const { data, error } = await this.client
      .from("royalty_cycles" as never)
      .select("*")
      .order("period_start", { ascending: false });
    if (error) throw error;
    return (data as RoyaltyCycle[]) ?? [];
  }

  async getMyRoyaltyCalculations(userId: string): Promise<RoyaltyCalculation[]> {
    const { data, error } = await this.client
      .from("royalty_calculations" as never)
      .select("*")
      .eq("artist_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as RoyaltyCalculation[]) ?? [];
  }

  async softDeletePayoutAccount(accountId: string): Promise<void> {
    const { error } = await this.client
      .from("payout_accounts" as never)
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", accountId);
    if (error) throw error;
  }
}
