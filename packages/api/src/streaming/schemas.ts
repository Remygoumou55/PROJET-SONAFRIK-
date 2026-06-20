import { z } from "zod";
import { FIELD_LIMITS } from "@sonafrik/shared";

export const startStreamSchema = z.object({
  trackId: z.string().uuid(),
  platform: z.enum(["web", "ios", "android"]).default("web"),
  qualityKbps: z.number().int().positive().optional(),
  deviceId: z.string().max(128).optional(),
});

export const streamHeartbeatSchema = z.object({
  sessionId: z.string().uuid(),
  positionSeconds: z.number().min(0),
});

export const completeStreamSchema = z.object({
  sessionId: z.string().uuid(),
  positionSeconds: z.number().min(0),
  totalDurationSeconds: z.number().min(0),
});

export const createPlaylistSchema = z.object({
  title: z.string().trim().min(2).max(FIELD_LIMITS.PLAYLIST_TITLE),
  description: z.string().trim().max(FIELD_LIMITS.PLAYLIST_DESCRIPTION).optional().nullable(),
  isPublic: z.boolean().default(false),
});

export const updatePlaylistSchema = createPlaylistSchema.partial();

export const addTrackToPlaylistSchema = z.object({
  playlistId: z.string().uuid(),
  trackId: z.string().uuid(),
});

export const toggleFavoriteSchema = z.object({
  entityType: z.enum(["track", "album", "artist", "playlist"]),
  entityId: z.string().uuid(),
});

export const savePositionSchema = z.object({
  trackId: z.string().uuid(),
  positionSeconds: z.number().min(0),
});

export const searchSchema = z.object({
  query: z.string().trim().min(1).max(200),
  limit: z.number().int().min(1).max(50).default(20),
  type: z.enum(["all", "tracks", "artists", "albums", "playlists", "beats"]).optional().default("all"),
});

export const analyticsSchema = z.object({
  creatorId: z.string().uuid(),
  periodDays: z.number().int().min(1).max(365).default(30),
});

export type StartStreamInput = z.infer<typeof startStreamSchema>;
export type StreamHeartbeatInput = z.infer<typeof streamHeartbeatSchema>;
export type CompleteStreamInput = z.infer<typeof completeStreamSchema>;
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
export type AddTrackToPlaylistInput = z.infer<typeof addTrackToPlaylistSchema>;
export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;
export type SavePositionInput = z.infer<typeof savePositionSchema>;
export type SearchInput = z.input<typeof searchSchema>;
export type SearchTypeInput = "all" | "tracks" | "artists" | "albums" | "playlists" | "beats";
export type AnalyticsInput = z.infer<typeof analyticsSchema>;
