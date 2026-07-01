import { describe, expect, it, vi } from "vitest";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { TipsRepository } from "./tips.repository";

describe("TipsRepository", () => {
  it("sendTip mappe le résultat RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { amount_sent: 5000, net_received: 4750, receiver_name: "Artiste" },
      error: null,
    });
    const client = { rpc } as unknown as SonafrikSupabaseClient;
    const repo = new TipsRepository(client);
    const result = await repo.sendTip("creator-id", 5000);
    expect(result.amountSent).toBe(5000);
    expect(result.netReceived).toBe(4750);
    expect(result.receiverName).toBe("Artiste");
  });
});
