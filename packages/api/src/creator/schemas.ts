import { z } from "zod";
import { GUINEAN_PHONE_REGEX, GUINEAN_PHONE_ERROR, FIELD_LIMITS } from "@sonafrik/shared";

export const updateArtistProfileSchema = z.object({
  stageName: z.string().trim().min(2).max(FIELD_LIMITS.STAGE_NAME),
  bio: z.string().trim().max(FIELD_LIMITS.ARTIST_BIO).optional().nullable(),
  genres: z.array(z.string().trim().min(2).max(50)).max(8).optional(),
  isPublic: z.boolean().optional(),
  socialLinks: z.record(z.string().url("URL invalide.")).optional(),
});

export const createLabelSchema = z.object({
  name: z.string().trim().min(2).max(FIELD_LIMITS.LABEL_NAME),
  description: z.string().trim().max(FIELD_LIMITS.LABEL_DESCRIPTION).optional().nullable(),
  countryCode: z.string().trim().length(2).optional(),
  websiteUrl: z.string().url().optional().nullable(),
});

export const inviteTeamMemberSchema = z.object({
  memberPhone: z.string().trim().regex(GUINEAN_PHONE_REGEX, GUINEAN_PHONE_ERROR),
  role: z.enum(["manager", "editor", "accountant", "viewer"]),
});

export const createVerificationSchema = z.object({
  verificationType: z.enum(["identity", "artist", "label"]),
  documentType: z.enum(["national_id", "passport", "business_license", "other"]).optional(),
  labelId: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const creatorAssetUploadSchema = z.object({
  creatorId: z.string().uuid(),
  assetKind: z.enum(["banner", "cover", "verification", "label_logo"]),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  verificationId: z.string().uuid().optional(),
  labelId: z.string().uuid().optional(),
});

export type UpdateArtistProfileInput = z.infer<typeof updateArtistProfileSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
export type CreateVerificationInput = z.infer<typeof createVerificationSchema>;
export type CreatorAssetUploadInput = z.infer<typeof creatorAssetUploadSchema>;
