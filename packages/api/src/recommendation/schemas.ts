import { z } from "zod";

export const trendingSchema = z.object({
  window: z.enum(["today", "7d", "30d"]).default("7d"),
  limit: z.number().int().min(1).max(100).default(20),
});

export const similarTracksSchema = z.object({
  trackId: z.string().uuid(),
  limit: z.number().int().min(1).max(50).default(10),
});

export const recommendationsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
});

export type TrendingInput = z.infer<typeof trendingSchema>;
export type SimilarTracksInput = z.infer<typeof similarTracksSchema>;
export type RecommendationsInput = z.infer<typeof recommendationsSchema>;
