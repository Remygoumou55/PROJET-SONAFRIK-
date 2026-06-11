import { z } from "zod";

export const subscribePremiumSchema = z.object({
  planType: z.enum(["monthly", "annual"]).default("monthly"),
});

export const addPayoutAccountSchema = z.object({
  type: z.enum(["orange_money", "mtn_momo", "wave", "bank_transfer"]),
  displayName: z.string().min(1).max(100),
  accountHolderName: z.string().min(1).max(100),
  phoneNumber: z.string().regex(/^\+?[0-9]{8,15}$/).optional(),
  iban: z.string().min(15).max(34).optional(),
  bankName: z.string().max(100).optional(),
  isDefault: z.boolean().default(false),
});

export const requestWithdrawalSchema = z.object({
  payoutAccountId: z.string().uuid(),
  amountGnf: z.number().min(5000, "Montant minimum 5 000 GNF"),
});

export const topupWalletSchema = z.object({
  amountGnf: z.number().min(1000, "Recharge minimum 1 000 GNF"),
  paymentMethod: z.enum(["orange_money", "mtn_momo", "wave", "card"]),
  paymentReference: z.string().min(1).max(200),
});

export type SubscribePremiumInput = z.infer<typeof subscribePremiumSchema>;
export type AddPayoutAccountInput = z.infer<typeof addPayoutAccountSchema>;
export type RequestWithdrawalInput = z.infer<typeof requestWithdrawalSchema>;
export type TopupWalletInput = z.infer<typeof topupWalletSchema>;
