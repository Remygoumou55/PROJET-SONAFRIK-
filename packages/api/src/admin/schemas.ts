import { z } from "zod";

export const toggleFeatureFlagSchema = z.object({
  name:    z.string().min(1).max(100),
  enabled: z.boolean(),
});

export const updateSystemSettingSchema = z.object({
  key:   z.string().min(1).max(100),
  value: z.unknown(),
});

export const triggerRoyaltyCycleSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalRevenueGnf: z.number().positive(),
  revenuePoolPercent: z.number().min(1).max(100).default(65),
});

export type ToggleFeatureFlagInput  = z.infer<typeof toggleFeatureFlagSchema>;
export type UpdateSystemSettingInput = z.infer<typeof updateSystemSettingSchema>;
export type TriggerRoyaltyCycleInput = z.infer<typeof triggerRoyaltyCycleSchema>;
