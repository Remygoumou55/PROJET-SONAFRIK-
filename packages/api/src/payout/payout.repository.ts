import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  UserPayoutEntry,
  PayoutSummary,
  AdminPayoutEntry,
  PayoutBatch,
} from "@sonafrik/types";

export class PayoutRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async approvePayoutRequest(withdrawalId: string): Promise<{ withdrawal_id: string; status: string }> {
    const { data, error } = await this.client.rpc("approve_payout_request", {
      p_withdrawal_id: withdrawalId,
    });
    if (error) throw error;
    return data as unknown as { withdrawal_id: string; status: string };
  }

  async rejectPayoutRequest(
    withdrawalId: string,
    reason: string,
  ): Promise<{ withdrawal_id: string; status: string; reason: string; refunded_gnf: number }> {
    const { data, error } = await this.client.rpc("reject_payout_request", {
      p_withdrawal_id: withdrawalId,
      p_reason: reason,
    });
    if (error) throw error;
    return data as unknown as { withdrawal_id: string; status: string; reason: string; refunded_gnf: number };
  }

  async processPayoutRequest(
    withdrawalId: string,
    batchId?: string,
  ): Promise<{ withdrawal_id: string; status: string; batch_id: string | null }> {
    const { data, error } = await this.client.rpc("process_payout_request", {
      p_withdrawal_id: withdrawalId,
      ...(batchId ? { p_batch_id: batchId } : {}),
    });
    if (error) throw error;
    return data as unknown as { withdrawal_id: string; status: string; batch_id: string | null };
  }

  async markPayoutPaid(
    withdrawalId: string,
    reference: string,
  ): Promise<{ withdrawal_id: string; status: string; reference: string }> {
    const { data, error } = await this.client.rpc("mark_payout_paid", {
      p_withdrawal_id: withdrawalId,
      p_reference: reference,
    });
    if (error) throw error;
    return data as unknown as { withdrawal_id: string; status: string; reference: string };
  }

  async cancelPayoutRequest(
    withdrawalId: string,
    reason?: string,
  ): Promise<{ withdrawal_id: string; status: string; refunded_gnf: number }> {
    const { data, error } = await this.client.rpc("cancel_payout_request", {
      p_withdrawal_id: withdrawalId,
      ...(reason ? { p_reason: reason } : {}),
    });
    if (error) throw error;
    return data as unknown as { withdrawal_id: string; status: string; refunded_gnf: number };
  }

  async getUserPayouts(limit: number): Promise<UserPayoutEntry[]> {
    const { data, error } = await this.client.rpc("get_user_payouts", {
      p_limit: limit,
    });
    if (error) throw error;
    return (data as unknown as UserPayoutEntry[]) ?? [];
  }

  async getPayoutSummary(): Promise<PayoutSummary> {
    const { data, error } = await this.client.rpc("get_payout_summary");
    if (error) throw error;
    return data as unknown as PayoutSummary;
  }

  async getAdminPayoutQueue(status: string, limit: number): Promise<AdminPayoutEntry[]> {
    const { data, error } = await this.client.rpc("get_admin_payout_queue", {
      p_status: status,
      p_limit: limit,
    });
    if (error) throw error;
    return (data as unknown as AdminPayoutEntry[]) ?? [];
  }

  async createPayoutBatch(name: string, notes?: string): Promise<string> {
    const { data, error } = await this.client.rpc("create_payout_batch", {
      p_name: name,
      ...(notes ? { p_notes: notes } : {}),
    });
    if (error) throw error;
    return data as string;
  }

  async listPayoutBatches(limit = 20): Promise<PayoutBatch[]> {
    const { data, error } = await this.client
      .from("payout_batches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as PayoutBatch[];
  }
}
