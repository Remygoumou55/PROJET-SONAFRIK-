import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  UserPayoutEntry,
  PayoutSummary,
  AdminPayoutEntry,
} from "@sonafrik/types";

export class PayoutRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async approvePayoutRequest(withdrawalId: string): Promise<{ withdrawal_id: string; status: string }> {
    const { data, error } = await this.client.rpc(
      "approve_payout_request" as never,
      { p_withdrawal_id: withdrawalId } as never,
    );
    if (error) throw error;
    return data as { withdrawal_id: string; status: string };
  }

  async rejectPayoutRequest(
    withdrawalId: string,
    reason: string,
  ): Promise<{ withdrawal_id: string; status: string; reason: string; refunded_gnf: number }> {
    const { data, error } = await this.client.rpc(
      "reject_payout_request" as never,
      { p_withdrawal_id: withdrawalId, p_reason: reason } as never,
    );
    if (error) throw error;
    return data as { withdrawal_id: string; status: string; reason: string; refunded_gnf: number };
  }

  async processPayoutRequest(
    withdrawalId: string,
    batchId?: string,
  ): Promise<{ withdrawal_id: string; status: string; batch_id: string | null }> {
    const { data, error } = await this.client.rpc(
      "process_payout_request" as never,
      { p_withdrawal_id: withdrawalId, p_batch_id: batchId ?? null } as never,
    );
    if (error) throw error;
    return data as { withdrawal_id: string; status: string; batch_id: string | null };
  }

  async markPayoutPaid(
    withdrawalId: string,
    reference: string,
  ): Promise<{ withdrawal_id: string; status: string; reference: string }> {
    const { data, error } = await this.client.rpc(
      "mark_payout_paid" as never,
      { p_withdrawal_id: withdrawalId, p_reference: reference } as never,
    );
    if (error) throw error;
    return data as { withdrawal_id: string; status: string; reference: string };
  }

  async cancelPayoutRequest(
    withdrawalId: string,
    reason?: string,
  ): Promise<{ withdrawal_id: string; status: string; refunded_gnf: number }> {
    const { data, error } = await this.client.rpc(
      "cancel_payout_request" as never,
      { p_withdrawal_id: withdrawalId, p_reason: reason ?? null } as never,
    );
    if (error) throw error;
    return data as { withdrawal_id: string; status: string; refunded_gnf: number };
  }

  async getUserPayouts(limit: number): Promise<UserPayoutEntry[]> {
    const { data, error } = await this.client.rpc(
      "get_user_payouts" as never,
      { p_limit: limit } as never,
    );
    if (error) throw error;
    return (data as UserPayoutEntry[]) ?? [];
  }

  async getPayoutSummary(): Promise<PayoutSummary> {
    const { data, error } = await this.client.rpc(
      "get_payout_summary" as never,
      {} as never,
    );
    if (error) throw error;
    return data as PayoutSummary;
  }

  async getAdminPayoutQueue(status: string, limit: number): Promise<AdminPayoutEntry[]> {
    const { data, error } = await this.client.rpc(
      "get_admin_payout_queue" as never,
      { p_status: status, p_limit: limit } as never,
    );
    if (error) throw error;
    return (data as AdminPayoutEntry[]) ?? [];
  }

  async createPayoutBatch(name: string, notes?: string): Promise<string> {
    const { data, error } = await this.client.rpc(
      "create_payout_batch" as never,
      { p_name: name, p_notes: notes ?? null } as never,
    );
    if (error) throw error;
    return data as string;
  }
}
