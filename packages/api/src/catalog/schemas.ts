import { z } from "zod";

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
  title: z.string().trim().min(2).max(200),
  releaseType: z.enum(["album", "single", "ep"]),
  upc: upcSchema.optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  releaseDate: z.string().date().optional().nullable(),
  genreIds: z.array(z.string().uuid()).max(5).optional(),
});

export const updateAlbumSchema = createAlbumSchema.partial();

export const createTrackSchema = z.object({
  title: z.string().trim().min(2).max(200),
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
  format: z.enum(["mp3", "aac", "flac", "wav"]).optional(),
  bitrateKbps: z.number().int().positive().optional(),
});

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
export type CatalogAssetUploadInput = z.infer<typeof catalogAssetUploadSchema>;
