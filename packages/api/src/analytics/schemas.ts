import { z } from "zod";

export const analyticsQuerySchema = z.object({
  periodDays: z.coerce.number().min(1).max(90),
});

export const analyticsWindowSchema = z.object({
  days: z.coerce.number().min(1).max(50),
});
