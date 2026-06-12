import { z } from "zod";

export const withdrawalIdSchema = z.object({
  withdrawalId: z.string().uuid(),
});

export const approvePayoutSchema = withdrawalIdSchema;

export const rejectPayoutSchema = z.object({
  withdrawalId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export const processPayoutSchema = z.object({
  withdrawalId: z.string().uuid(),
  batchId: z.string().uuid().optional(),
});

export const markPaidSchema = z.object({
  withdrawalId: z.string().uuid(),
  reference: z.string().min(1).max(200),
});

export const cancelPayoutSchema = z.object({
  withdrawalId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const getUserPayoutsSchema = z.object({
  limit: z.number().int().positive().max(100).default(20),
});

export const adminQueueSchema = z.object({
  status: z.enum(["pending", "approved", "processing", "completed", "cancelled", "all"]).default("pending"),
  limit: z.number().int().positive().max(200).default(50),
});

export const createBatchSchema = z.object({
  name: z.string().min(1).max(100),
  notes: z.string().max(500).optional(),
});

export type WithdrawalIdInput    = z.infer<typeof withdrawalIdSchema>;
export type ApprovePayoutInput   = z.infer<typeof approvePayoutSchema>;
export type RejectPayoutInput    = z.infer<typeof rejectPayoutSchema>;
export type ProcessPayoutInput   = z.infer<typeof processPayoutSchema>;
export type MarkPaidInput        = z.infer<typeof markPaidSchema>;
export type CancelPayoutInput    = z.infer<typeof cancelPayoutSchema>;
export type GetUserPayoutsInput  = z.infer<typeof getUserPayoutsSchema>;
export type AdminQueueInput      = z.infer<typeof adminQueueSchema>;
export type CreateBatchInput     = z.infer<typeof createBatchSchema>;
