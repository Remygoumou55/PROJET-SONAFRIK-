import { z } from "zod";
import { GUINEAN_PHONE_REGEX, GUINEAN_PHONE_ERROR } from "@sonafrik/shared";

/** +224 suivi de 9 chiffres — ex. +224624000001 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(GUINEAN_PHONE_REGEX, GUINEAN_PHONE_ERROR);

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Le code doit contenir exactement 6 chiffres.");

export const accountTypeSchema = z.enum(["auditeur", "artiste", "auditeur_artiste"]);

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Le nom doit contenir au moins 2 caractères.")
  .max(100, "Le nom ne peut pas dépasser 100 caractères.");

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  token: otpSchema,
});

export const completeOnboardingSchema = z.object({
  accountType: accountTypeSchema,
  fullName: fullNameSchema,
});

export const registerSessionSchema = z.object({
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  platform: z.enum(["web", "ios", "android"]),
  userAgent: z.string().optional(),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
export type RegisterSessionInput = z.infer<typeof registerSessionSchema>;
