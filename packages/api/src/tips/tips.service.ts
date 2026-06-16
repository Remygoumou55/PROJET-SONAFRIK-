import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Tip } from "@sonafrik/types";
import { TipsError } from "./errors";
import { TipsRepository } from "./tips.repository";
import { sendTipSchema } from "./schemas";

export class TipsService {
  private readonly repository: TipsRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new TipsRepository(client);
  }

  private async requireUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) throw new TipsError("unauthorized");
    return user.id;
  }

  async sendTip(params: {
    recipientId: string;
    amountGnf: number;
    message?: string;
  }): Promise<string> {
    const parsed = sendTipSchema.safeParse(params);
    if (!parsed.success) throw new TipsError("amount_too_low");

    const senderId = await this.requireUserId();
    if (senderId === params.recipientId) throw new TipsError("self_tip");

    const tipId = await this.repository
      .sendTip(senderId, params.recipientId, params.amountGnf, params.message)
      .catch((err: Error) => {
        if (err.message?.includes("insufficient_balance")) throw new TipsError("insufficient_balance");
        throw new TipsError("send_failed");
      });
    return tipId;
  }

  async getSentTips(): Promise<Tip[]> {
    const userId = await this.requireUserId();
    return this.repository.getSentTips(userId).catch(() => {
      throw new TipsError("list_failed");
    });
  }

  async getReceivedTips(): Promise<Tip[]> {
    const userId = await this.requireUserId();
    return this.repository.getReceivedTips(userId).catch(() => {
      throw new TipsError("list_failed");
    });
  }
}

export function createTipsService(client: SonafrikSupabaseClient): TipsService {
  return new TipsService(client);
}
