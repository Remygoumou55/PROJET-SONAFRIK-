import { z } from "zod";
import { FIELD_LIMITS } from "@sonafrik/shared";

const isrcSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/, "Code ISRC invalide.");

const upcSchema = z
  .string()
  .trim()
  .regex(/^\d{12,14}$/, "Code UPC invalide (12-14 chiffres).");

export const createAlbumSchema = z.object({
  title: z.string().trim().min(2).max(FIELD_LIMITS.ALBUM_TITLE),
  releaseType: z.enum(["album", "single", "ep"]),
  upc: upcSchema.optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  releaseDate: z.string().date().optional().nullable(),
  genreIds: z.array(z.string().uuid()).max(5).optional(),
});

export const updateAlbumSchema = createAlbumSchema.partial();

export const createTrackSchema = z.object({
  title: z.string().trim().min(2).max(FIELD_LIMITS.TRACK_TITLE),
  albumId: z.string().uuid().optional().nullable(),
  trackNumber: z.number().int().min(1).optional(),
  isrc: isrcSchema.optional().nullable(),
  durationSeconds: z.number().int().min(0).optional().nullable(),
  explicit: z.boolean().optional(),
  language: z.string().trim().length(2).optional(),
  bpm: z.number().int().min(40).max(240).optional().nullable(),
  musicalKey: z.string().trim().max(10).optional().nullable(),
  genreIds: z.array(z.string().uuid()).max(5).optional(),
});

export const updateTrackSchema = createTrackSchema.partial();

export const catalogAssetUploadSchema = z.object({
  creatorId: z.string().uuid(),
  assetType: z.enum(["audio", "cover"]),
  contentType: z.string().min(3),
  trackId: z.string().uuid().optional(),
  albumId: z.string().uuid().optional(),
  // WAV retiré : 30-40MB impraticables sur mobile. Pipeline WAV→MP3 prévu Phase 2.
  format: z.enum(["mp3", "aac"]).optional(),
  bitrateKbps: z.number().int().positive().optional(),
});

export const catalogAssetConfirmSchema = z.object({
  creatorId: z.string().uuid(),
  trackId: z.string().uuid(),
  path: z.string().min(1),
  format: z.enum(["mp3", "aac"]),
  contentType: z.string().min(3),
  fileSizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
  durationSeconds: z.number().int().min(0).optional(),
  contentHash: z.string().length(64).optional(),
});

export const trackCreditItemSchema = z.object({
  contributorName: z.string().trim().min(1).max(100),
  role: z.enum([
    "artiste_principal",
    "featuring",
    "auteur",
    "compositeur",
    "producteur",
    "beatmaker",
    "mixage",
    "mastering",
  ]),
  displayOrder: z.number().int().min(0).optional(),
  contributorProfileId: z.string().uuid().optional().nullable(),
});

export const setTrackCreditsSchema = z.object({
  trackId: z.string().uuid(),
  credits: z.array(trackCreditItemSchema).max(20),
});

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
export type CatalogAssetUploadInput = z.infer<typeof catalogAssetUploadSchema>;
export type CatalogAssetConfirmInput = z.infer<typeof catalogAssetConfirmSchema>;
export type TrackCreditItem = z.infer<typeof trackCreditItemSchema>;
export type SetTrackCreditsInput = z.infer<typeof setTrackCreditsSchema>;
