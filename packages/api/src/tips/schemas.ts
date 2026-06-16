import { z } from "zod";

export const sendTipSchema = z.object({
  recipientId: z.string().uuid(),
  amountGnf:   z.number().int().min(100, "Minimum 100 GNF"),
  message:     z.string().max(280).optional(),
});

export type SendTipInput = z.infer<typeof sendTipSchema>;
