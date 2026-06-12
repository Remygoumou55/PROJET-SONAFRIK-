import { z } from "zod";

export const openCycleSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalRevenueGnf: z.number().positive(),
  revenuePoolPercent: z.number().min(1).max(100).default(65),
});

export const cycleIdSchema = z.object({
  cycleId: z.string().uuid(),
});

export const creatorRoyaltyHistorySchema = z.object({
  creatorId: z.string().uuid(),
  limit: z.number().int().min(1).max(60).default(12),
});

export type OpenCycleInput = z.infer<typeof openCycleSchema>;
export type CycleIdInput = z.infer<typeof cycleIdSchema>;
export type CreatorRoyaltyHistoryInput = z.infer<typeof creatorRoyaltyHistorySchema>;
