import type { SonafrikSupabaseClient } from "@sonafrik/database";

export interface TipResult {
  amountSent:   number;
  netReceived:  number;
  receiverName: string;
}

export class TipsRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async sendTip(
    receiverCreatorId: string,
    amountGnf: number,
  ): Promise<TipResult> {
    const { data, error } = await this.client.rpc("send_tip", {
      p_receiver_creator_id: receiverCreatorId,
      p_amount_gnf:          amountGnf,
    });
    if (error) throw error;
    const row = data as { amount_sent: number; net_received: number; receiver_name: string };
    return {
      amountSent:   row.amount_sent,
      netReceived:  row.net_received,
      receiverName: row.receiver_name,
    };
  }
}
