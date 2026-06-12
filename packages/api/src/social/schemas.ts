import { z } from "zod";

export const followEntityTypeSchema = z.enum(["artist", "creator", "playlist"]);
export const favoriteEntityTypeSchema = z.enum(["track", "album", "artist", "playlist"]);
export const engagementEntityTypeSchema = z.enum(["track", "album", "artist", "creator", "playlist"]);

export const toggleFollowSchema = z.object({
  entityType: followEntityTypeSchema,
  entityId: z.string().uuid(),
});

export const isFollowingSchema = z.object({
  entityType: followEntityTypeSchema,
  entityId: z.string().uuid(),
});

export const getFollowCountSchema = z.object({
  entityType: followEntityTypeSchema,
  entityId: z.string().uuid(),
});

export const toggleLikeSchema = z.object({
  trackId: z.string().uuid(),
});

export const getLikeCountSchema = z.object({
  trackId: z.string().uuid(),
});

export const toggleFavoriteSchema = z.object({
  entityType: favoriteEntityTypeSchema,
  entityId: z.string().uuid(),
});

export const getEngagementStatsSchema = z.object({
  entityType: engagementEntityTypeSchema,
  entityId: z.string().uuid(),
});

export const getCreatorEngagementStatsSchema = z.object({
  creatorId: z.string().uuid(),
});

export type ToggleFollowInput = z.infer<typeof toggleFollowSchema>;
export type IsFollowingInput = z.infer<typeof isFollowingSchema>;
export type GetFollowCountInput = z.infer<typeof getFollowCountSchema>;
export type ToggleLikeInput = z.infer<typeof toggleLikeSchema>;
export type GetLikeCountInput = z.infer<typeof getLikeCountSchema>;
export type ToggleSocialFavoriteInput = z.infer<typeof toggleFavoriteSchema>;
export type GetEngagementStatsInput = z.infer<typeof getEngagementStatsSchema>;
export type GetCreatorEngagementStatsInput = z.infer<typeof getCreatorEngagementStatsSchema>;
