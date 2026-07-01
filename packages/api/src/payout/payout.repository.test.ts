import { describe, expect, it, vi } from "vitest";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { PayoutRepository } from "./payout.repository";

describe("PayoutRepository", () => {
  it("approvePayoutRequest appelle la RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { withdrawal_id: "id-1", status: "approved" },
      error: null,
    });
    const client = { rpc } as unknown as SonafrikSupabaseClient;
    const repo = new PayoutRepository(client);
    const result = await repo.approvePayoutRequest("id-1");
    expect(rpc).toHaveBeenCalledWith("approve_payout_request", { p_withdrawal_id: "id-1" });
    expect(result.status).toBe("approved");
  });

  it("rejectPayoutRequest propage erreur RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error("reject_failed") });
    const client = { rpc } as unknown as SonafrikSupabaseClient;
    const repo = new PayoutRepository(client);
    await expect(repo.rejectPayoutRequest("id-1", "raison")).rejects.toThrow("reject_failed");
  });
});
