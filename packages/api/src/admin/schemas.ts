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

export const adminWarnUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(3).max(500).optional(),
  adminNote: z.string().max(1000).optional(),
});

export const adminSuspendUserSchema = z.object({
  userId: z.string().uuid(),
  durationDays: z.number().int().min(1).max(3650).optional(),
  reason: z.string().min(3).max(500).optional(),
});

export const adminDeleteUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(3).max(500).optional(),
});

export const adminVerifyArtistSchema = z.object({
  creatorId: z.string().uuid(),
  approved: z.boolean(),
  note: z.string().max(1000).optional(),
});

export const adminChangeArtistTierSchema = z.object({
  creatorId: z.string().uuid(),
  newTier: z.enum(["emergent", "croissance", "etabli"]),
});

export const adminSuspendCreatorSchema = z.object({
  creatorId: z.string().uuid(),
  reason: z.string().min(3).max(500).optional(),
});
