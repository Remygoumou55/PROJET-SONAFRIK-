import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { TipsError } from "./errors";
import { TipsRepository, type TipResult } from "./tips.repository";
import { sendTipSchema } from "./schemas";

export class TipsService {
  private readonly repository: TipsRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new TipsRepository(client);
  }

  async sendTip(params: { receiverCreatorId: string; amountGnf: 5000 | 10000 | 20000 }): Promise<TipResult> {
    const parsed = sendTipSchema.safeParse(params);
    if (!parsed.success) throw new TipsError("invalid_amount");

    return this.repository
      .sendTip(parsed.data.receiverCreatorId, parsed.data.amountGnf)
      .catch((err: Error) => {
        const msg = err.message ?? "";
        if (msg.includes("insufficient_balance")) throw new TipsError("insufficient_balance");
        if (msg.includes("invalid_amount"))       throw new TipsError("invalid_amount");
        if (msg.includes("receiver_not_found"))   throw new TipsError("receiver_not_found");
        if (msg.includes("self_tip"))             throw new TipsError("self_tip");
        if (msg.includes("unauthorized"))         throw new TipsError("unauthorized");
        throw new TipsError("send_failed");
      });
  }
}

export function createTipsService(client: SonafrikSupabaseClient): TipsService {
  return new TipsService(client);
}
