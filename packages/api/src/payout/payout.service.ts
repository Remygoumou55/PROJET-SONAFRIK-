import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  UserPayoutEntry,
  PayoutSummary,
  AdminPayoutEntry,
} from "@sonafrik/types";
import { PayoutEngineError } from "./errors";
import { PayoutRepository } from "./payout.repository";
import {
  approvePayoutSchema,
  rejectPayoutSchema,
  processPayoutSchema,
  markPaidSchema,
  cancelPayoutSchema,
  getUserPayoutsSchema,
  adminQueueSchema,
  createBatchSchema,
  type ApprovePayoutInput,
  type RejectPayoutInput,
  type ProcessPayoutInput,
  type MarkPaidInput,
  type CancelPayoutInput,
  type GetUserPayoutsInput,
  type AdminQueueInput,
  type CreateBatchInput,
} from "./schemas";

export class PayoutService {
  private readonly repo: PayoutRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repo = new PayoutRepository(client);
  }

  async approvePayoutRequest(input: ApprovePayoutInput) {
    const parsed = approvePayoutSchema.safeParse(input);
    if (!parsed.success) throw new PayoutEngineError("withdrawal_not_found");
    try {
      return await this.repo.approvePayoutRequest(parsed.data.withdrawalId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("not_found")) throw new PayoutEngineError("withdrawal_not_found");
      if (msg.includes("pending")) throw new PayoutEngineError("withdrawal_must_be_pending");
      throw new PayoutEngineError("approve_failed");
    }
  }

  async rejectPayoutRequest(input: RejectPayoutInput) {
    const parsed = rejectPayoutSchema.safeParse(input);
    if (!parsed.success) throw new PayoutEngineError("rejection_reason_required");
    try {
      return await this.repo.rejectPayoutRequest(parsed.data.withdrawalId, parsed.data.reason);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("not_found")) throw new PayoutEngineError("withdrawal_not_found");
      if (msg.includes("reason")) throw new PayoutEngineError("rejection_reason_required");
      throw new PayoutEngineError("reject_failed");
    }
  }

  async processPayoutRequest(input: ProcessPayoutInput) {
    const parsed = processPayoutSchema.safeParse(input);
    if (!parsed.success) throw new PayoutEngineError("withdrawal_not_found");
    try {
      return await this.repo.processPayoutRequest(parsed.data.withdrawalId, parsed.data.batchId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("not_found")) throw new PayoutEngineError("withdrawal_not_found");
      if (msg.includes("approved")) throw new PayoutEngineError("withdrawal_must_be_approved");
      if (msg.includes("batch")) throw new PayoutEngineError("batch_not_found_or_closed");
      throw new PayoutEngineError("process_failed");
    }
  }

  async markPayoutPaid(input: MarkPaidInput) {
    const parsed = markPaidSchema.safeParse(input);
    if (!parsed.success) throw new PayoutEngineError("payment_reference_required");
    try {
      return await this.repo.markPayoutPaid(parsed.data.withdrawalId, parsed.data.reference);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("not_found")) throw new PayoutEngineError("withdrawal_not_found");
      if (msg.includes("processing")) throw new PayoutEngineError("withdrawal_must_be_processing");
      if (msg.includes("reference")) throw new PayoutEngineError("payment_reference_required");
      throw new PayoutEngineError("mark_paid_failed");
    }
  }

  async cancelPayoutRequest(input: CancelPayoutInput) {
    const parsed = cancelPayoutSchema.safeParse(input);
    if (!parsed.success) throw new PayoutEngineError("withdrawal_not_found");
    try {
      return await this.repo.cancelPayoutRequest(parsed.data.withdrawalId, parsed.data.reason);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("not_found")) throw new PayoutEngineError("withdrawal_not_found");
      if (msg.includes("cancel")) throw new PayoutEngineError("cannot_cancel");
      throw new PayoutEngineError("cancel_failed");
    }
  }

  async getUserPayouts(input?: Partial<GetUserPayoutsInput>): Promise<UserPayoutEntry[]> {
    const parsed = getUserPayoutsSchema.safeParse(input ?? {});
    if (!parsed.success) throw new PayoutEngineError("payouts_failed");
    try {
      return await this.repo.getUserPayouts(parsed.data.limit);
    } catch {
      throw new PayoutEngineError("payouts_failed");
    }
  }

  async getPayoutSummary(): Promise<PayoutSummary> {
    try {
      return await this.repo.getPayoutSummary();
    } catch {
      throw new PayoutEngineError("summary_failed");
    }
  }

  async getAdminPayoutQueue(input?: Partial<AdminQueueInput>): Promise<AdminPayoutEntry[]> {
    const parsed = adminQueueSchema.safeParse(input ?? {});
    if (!parsed.success) throw new PayoutEngineError("queue_failed");
    try {
      return await this.repo.getAdminPayoutQueue(parsed.data.status, parsed.data.limit);
    } catch {
      throw new PayoutEngineError("queue_failed");
    }
  }

  async createPayoutBatch(input: CreateBatchInput): Promise<string> {
    const parsed = createBatchSchema.safeParse(input);
    if (!parsed.success) throw new PayoutEngineError("batch_name_required");
    try {
      return await this.repo.createPayoutBatch(parsed.data.name, parsed.data.notes);
    } catch {
      throw new PayoutEngineError("batch_name_required");
    }
  }
}

export function createPayoutService(client: SonafrikSupabaseClient): PayoutService {
  return new PayoutService(client);
}
