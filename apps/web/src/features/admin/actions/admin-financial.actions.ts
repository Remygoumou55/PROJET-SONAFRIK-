"use server";

import { revalidatePath } from "next/cache";
import type { AdminPayoutEntry, PayoutBatch } from "@sonafrik/types";
import {
  formatPayoutActionError,
  getPayoutServiceForAction,
  type AdminActionResult,
} from "@/features/admin/lib/getAdminActionContext";

const PAYOUT_PATHS = ["/admin/withdrawals", "/admin/finance", "/admin"] as const;

function revalidatePayoutPaths() {
  for (const path of PAYOUT_PATHS) {
    revalidatePath(path);
  }
}

type QueueStatus = "pending" | "approved" | "processing" | "completed" | "cancelled" | "all";

export async function adminApproveWithdrawalAction(
  withdrawalId: string,
): Promise<AdminActionResult> {
  const ctx = await getPayoutServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.approvePayoutRequest({ withdrawalId });
    revalidatePayoutPaths();
    return {};
  } catch (err) {
    return { error: formatPayoutActionError(err) };
  }
}

export async function adminRejectWithdrawalAction(
  withdrawalId: string,
  reason: string,
): Promise<AdminActionResult> {
  const trimmed = reason.trim();
  if (!trimmed) return { error: "Le motif de refus est obligatoire." };

  const ctx = await getPayoutServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.rejectPayoutRequest({ withdrawalId, reason: trimmed });
    revalidatePayoutPaths();
    return {};
  } catch (err) {
    return { error: formatPayoutActionError(err) };
  }
}

export async function adminProcessWithdrawalAction(
  withdrawalId: string,
  batchId?: string,
): Promise<AdminActionResult> {
  const ctx = await getPayoutServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.processPayoutRequest({ withdrawalId, batchId });
    revalidatePayoutPaths();
    return {};
  } catch (err) {
    return { error: formatPayoutActionError(err) };
  }
}

export async function adminMarkWithdrawalPaidAction(
  withdrawalId: string,
  reference: string,
): Promise<AdminActionResult> {
  const trimmed = reference.trim();
  if (!trimmed) return { error: "Référence de paiement obligatoire." };

  const ctx = await getPayoutServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.markPayoutPaid({ withdrawalId, reference: trimmed });
    revalidatePayoutPaths();
    return {};
  } catch (err) {
    return { error: formatPayoutActionError(err) };
  }
}

export async function adminCancelWithdrawalAction(
  withdrawalId: string,
  reason?: string,
): Promise<AdminActionResult> {
  const ctx = await getPayoutServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.cancelPayoutRequest({ withdrawalId, reason: reason?.trim() });
    revalidatePayoutPaths();
    return {};
  } catch (err) {
    return { error: formatPayoutActionError(err) };
  }
}

export async function adminGetPayoutQueueAction(
  status: QueueStatus = "pending",
): Promise<AdminActionResult<{ queue: AdminPayoutEntry[] }>> {
  const ctx = await getPayoutServiceForAction();
  if (!ctx.ok) return { error: ctx.error, queue: [] };

  try {
    const queue = await ctx.service.getAdminPayoutQueue({ status, limit: 100 });
    return { queue };
  } catch (err) {
    return { error: formatPayoutActionError(err), queue: [] };
  }
}

export async function adminCreatePayoutBatchAction(input: {
  name: string;
  notes?: string;
}): Promise<AdminActionResult<{ batchId?: string }>> {
  const name = input.name.trim();
  if (!name) return { error: "Nom du lot requis." };

  const ctx = await getPayoutServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    const batchId = await ctx.service.createPayoutBatch({ name, notes: input.notes?.trim() });
    revalidatePayoutPaths();
    return { batchId };
  } catch (err) {
    return { error: formatPayoutActionError(err) };
  }
}

export async function adminListPayoutBatchesAction(
  limit = 20,
): Promise<AdminActionResult<{ batches: PayoutBatch[] }>> {
  const ctx = await getPayoutServiceForAction();
  if (!ctx.ok) return { error: ctx.error, batches: [] };

  try {
    const batches = await ctx.service.listPayoutBatches(limit);
    return { batches };
  } catch (err) {
    return { error: formatPayoutActionError(err), batches: [] };
  }
}
