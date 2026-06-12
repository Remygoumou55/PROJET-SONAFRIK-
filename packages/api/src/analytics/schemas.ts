import { z } from "zod";

export const creatorAnalyticsInputSchema = z.object({
  creatorId: z.string().uuid(),
});

export const streamTimelineInputSchema = z.object({
  creatorId: z.string().uuid(),
  days: z.number().int().min(7).max(90).default(30),
});

export const topContentInputSchema = z.object({
  creatorId: z.string().uuid(),
  limit: z.number().int().min(1).max(50).default(10),
});

export type CreatorAnalyticsInput = z.infer<typeof creatorAnalyticsInputSchema>;
export type StreamTimelineInput = z.infer<typeof streamTimelineInputSchema>;
export type TopContentInput = z.infer<typeof topContentInputSchema>;
