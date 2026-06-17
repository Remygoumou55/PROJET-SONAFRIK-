import { z } from "zod";
import type { PaymentProvider, PaymentPurpose } from "@sonafrik/types";

export const PAYMENT_PROVIDERS = ["orange_money_gn", "mtn_momo_gn", "wave_gn", "soutra_money"] as const;
export const PAYMENT_PURPOSES  = [
  "topup",
  "subscription_daily", "subscription_weekly",
  "subscription_monthly", "subscription_yearly",
  "subscription_diaspora",
] as const;

export const initiatePaymentSchema = z.object({
  provider:    z.enum(PAYMENT_PROVIDERS),
  purpose:     z.enum(PAYMENT_PURPOSES),
  amountGnf:   z.number().positive(),
  phone:       z.string().min(8).max(20),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

// Re-export pour commodité
export type { PaymentProvider, PaymentPurpose };
