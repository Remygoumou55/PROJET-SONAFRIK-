import { z } from "zod";

export const toggleFeatureFlagSchema = z.object({
  name:    z.string().min(1).max(100),
  enabled: z.boolean(),
});

export const updateSystemSettingSchema = z.object({
  key:   z.string().min(1).max(100),
  value: z.unknown(),
});

export type ToggleFeatureFlagInput  = z.infer<typeof toggleFeatureFlagSchema>;
export type UpdateSystemSettingInput = z.infer<typeof updateSystemSettingSchema>;
