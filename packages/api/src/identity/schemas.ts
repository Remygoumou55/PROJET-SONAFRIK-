import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  bio: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().min(2).max(100).optional(),
  countryCode: z.string().trim().length(2).optional(),
  email: z.string().email("Adresse email invalide.").optional().nullable(),
});

export const updatePreferencesSchema = z.object({
  language: z.enum(["fr", "en"]).optional(),
  audioQuality: z.enum(["64", "128", "256", "auto"]).optional(),
  dataSaver: z.boolean().optional(),
  autoplayOnWifi: z.boolean().optional(),
  autoplayOnCellular: z.boolean().optional(),
  explicitContentAllowed: z.boolean().optional(),
  profileVisibility: z.enum(["public", "private"]).optional(),
  showListeningActivity: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  marketingNotifications: z.boolean().optional(),
  awardsReminders: z.boolean().optional(),
  newReleasesAlerts: z.boolean().optional(),
  artistCommentReplies: z.boolean().optional(),
  timezone: z.string().min(3).max(64).optional(),
});

export const avatarUploadRequestSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type AvatarUploadRequestInput = z.infer<typeof avatarUploadRequestSchema>;
