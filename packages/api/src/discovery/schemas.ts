import { z } from "zod";

export const discoveryFeedSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
});

export const newReleasesSchema = z.object({
  type: z.enum(["track", "album", "artist", "all"]).default("all"),
  days: z.number().int().min(1).max(365).default(30),
  limit: z.number().int().min(1).max(100).default(20),
});

export const suggestedArtistsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
});

export const suggestedAlbumsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
});

export type DiscoveryFeedInput = z.infer<typeof discoveryFeedSchema>;
export type NewReleasesInput = z.infer<typeof newReleasesSchema>;
export type SuggestedArtistsInput = z.infer<typeof suggestedArtistsSchema>;
export type SuggestedAlbumsInput = z.infer<typeof suggestedAlbumsSchema>;
