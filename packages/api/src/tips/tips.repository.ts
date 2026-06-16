import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { Tip } from "@sonafrik/types";

export class TipsRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async sendTip(
    senderId: string,
    recipientId: string,
    amountGnf: number,
    message?: string,
  ): Promise<string> {
    const { data, error } = await this.client.rpc("send_tip" as never, {
      p_sender_id:    senderId,
      p_recipient_id: recipientId,
      p_amount_gnf:   amountGnf,
      p_message:      message ?? null,
    } as never);
    if (error) throw error;
    return data as string;
  }

  async getSentTips(userId: string): Promise<Tip[]> {
    const { data, error } = await this.client
      .from("tips" as never)
      .select("*")
      .eq("sender_id" as never, userId)
      .order("created_at" as never, { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as unknown as Tip[];
  }

  async getReceivedTips(userId: string): Promise<Tip[]> {
    const { data, error } = await this.client
      .from("tips" as never)
      .select("*")
      .eq("recipient_id" as never, userId)
      .order("created_at" as never, { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as unknown as Tip[];
  }
}
