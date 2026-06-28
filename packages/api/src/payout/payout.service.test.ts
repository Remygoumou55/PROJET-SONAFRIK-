import { describe, expect, it, vi } from "vitest";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { PayoutService } from "./payout.service";
import { PayoutEngineError } from "./errors";

const WITHDRAWAL_ID = "33333333-3333-4333-8333-333333333333";

function createMockClient(rpcImpl?: ReturnType<typeof vi.fn>): SonafrikSupabaseClient {
  return {
    rpc: rpcImpl ?? vi.fn(),
    from: vi.fn(),
  } as unknown as SonafrikSupabaseClient;
}

describe("PayoutService", () => {
  it("approvePayoutRequest délègue au RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { ok: true }, error: null });
    const service = new PayoutService(createMockClient(rpc));

    await service.approvePayoutRequest({ withdrawalId: WITHDRAWAL_ID });
    expect(rpc).toHaveBeenCalledWith("approve_payout_request", {
      p_withdrawal_id: WITHDRAWAL_ID,
    });
  });

  it("approvePayoutRequest traduit withdrawal_not_found", async () => {
    const rpc = vi.fn().mockRejectedValue(new Error("withdrawal_not_found"));
    const service = new PayoutService(createMockClient(rpc));

    await expect(service.approvePayoutRequest({ withdrawalId: WITHDRAWAL_ID }))
      .rejects.toMatchObject({ code: "withdrawal_not_found" });
  });

  it("rejectPayoutRequest exige une raison", async () => {
    const service = new PayoutService(createMockClient());
    await expect(service.rejectPayoutRequest({ withdrawalId: WITHDRAWAL_ID, reason: "" }))
      .rejects.toMatchObject({ code: "rejection_reason_required" });
  });

  it("markPayoutPaid exige une référence", async () => {
    const service = new PayoutService(createMockClient());
    await expect(service.markPayoutPaid({ withdrawalId: WITHDRAWAL_ID, reference: "" }))
      .rejects.toMatchObject({ code: "payment_reference_required" });
  });

  it("getUserPayouts retourne les entrées", async () => {
    const rows = [{ withdrawal_id: WITHDRAWAL_ID, status: "pending" }];
    const rpc = vi.fn().mockResolvedValue({ data: rows, error: null });
    const service = new PayoutService(createMockClient(rpc));

    const payouts = await service.getUserPayouts({ limit: 10 });
    expect(payouts).toEqual(rows);
    expect(rpc).toHaveBeenCalledWith("get_user_payouts", { p_limit: 10 });
  });

  it("createPayoutBatch rejette un nom vide", async () => {
    const service = new PayoutService(createMockClient());
    await expect(service.createPayoutBatch({ name: "" }))
      .rejects.toBeInstanceOf(PayoutEngineError);
  });
});
