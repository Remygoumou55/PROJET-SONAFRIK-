import { z } from "zod";

export const sendTipSchema = z.object({
  receiverCreatorId: z.string().uuid(),
  amountGnf: z.union([
    z.literal(5000),
    z.literal(10000),
    z.literal(20000),
  ]),
});

export type SendTipInput = z.infer<typeof sendTipSchema>;
