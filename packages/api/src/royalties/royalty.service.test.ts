import { describe, expect, it, vi } from "vitest";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { RoyaltyService } from "./royalty.service";
import { RoyaltyEngineError } from "./errors";

const CYCLE_ID = "11111111-1111-4111-8111-111111111111";
const CREATOR_ID = "22222222-2222-4222-8222-222222222222";

function createMockClient(overrides: {
  rpc?: ReturnType<typeof vi.fn>;
  cycles?: unknown[];
}): SonafrikSupabaseClient {
  const from = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: overrides.cycles ?? [], error: null }),
  }));

  return {
    rpc: overrides.rpc ?? vi.fn(),
    from,
  } as unknown as SonafrikSupabaseClient;
}

describe("RoyaltyService", () => {
  it("openCycle délègue au RPC et retourne cycleId", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: CYCLE_ID, error: null });
    const service = new RoyaltyService(createMockClient({ rpc }));

    const id = await service.openCycle({
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      totalRevenueGnf: 1_000_000,
      revenuePoolPercent: 65,
    });

    expect(id).toBe(CYCLE_ID);
    expect(rpc).toHaveBeenCalledWith("open_royalty_cycle", expect.objectContaining({
      p_period_start: "2026-06-01",
      p_revenue_pool_percent: 65,
    }));
  });

  it("openCycle rejette une période invalide", async () => {
    const service = new RoyaltyService(createMockClient({}));
    await expect(service.openCycle({
      periodStart: "invalid",
      periodEnd: "2026-06-30",
      totalRevenueGnf: 1000,
    })).rejects.toBeInstanceOf(RoyaltyEngineError);
  });

  it("openCycle traduit chevauchement", async () => {
    const rpc = vi.fn().mockRejectedValue(new Error("chevauche un cycle existant"));
    const service = new RoyaltyService(createMockClient({ rpc }));

    await expect(service.openCycle({
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      totalRevenueGnf: 1000,
    })).rejects.toMatchObject({ code: "cycle_overlap" });
  });

  it("calculateRoyalties retourne le résultat RPC", async () => {
    const payload = {
      cycle_id: CYCLE_ID,
      total_valid_listens: 100,
      artist_count: 5,
      status: "ready",
    };
    const rpc = vi.fn().mockResolvedValue({ data: payload, error: null });
    const service = new RoyaltyService(createMockClient({ rpc }));

    const result = await service.calculateRoyalties({ cycleId: CYCLE_ID });
    expect(result).toEqual(payload);
  });

  it("calculateRoyalties rejette cycleId invalide", async () => {
    const service = new RoyaltyService(createMockClient({}));
    await expect(service.calculateRoyalties({ cycleId: "not-a-uuid" }))
      .rejects.toMatchObject({ code: "calculate_failed" });
  });

  it("distributeRoyalties retourne le résultat RPC", async () => {
    const payload = { cycle_id: CYCLE_ID, distributed_count: 3, total_gnf: 5000, status: "distributed" };
    const rpc = vi.fn().mockResolvedValue({ data: payload, error: null });
    const service = new RoyaltyService(createMockClient({ rpc }));

    const result = await service.distributeRoyalties({ cycleId: CYCLE_ID });
    expect(result).toEqual(payload);
  });

  it("getCreatorRoyaltyHistory retourne les entrées", async () => {
    const rows = [{ cycle_id: CYCLE_ID, net_amount_gnf: 1000 }];
    const rpc = vi.fn().mockResolvedValue({ data: rows, error: null });
    const service = new RoyaltyService(createMockClient({ rpc }));

    const history = await service.getCreatorRoyaltyHistory({ creatorId: CREATOR_ID, limit: 5 });
    expect(history).toEqual(rows);
  });

  it("triggerRoyaltyCycle enchaîne open → calculate → distribute", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: CYCLE_ID, error: null })
      .mockResolvedValueOnce({
        data: { cycle_id: CYCLE_ID, total_valid_listens: 10, artist_count: 2, status: "ready" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { cycle_id: CYCLE_ID, distributed_count: 2, total_gnf: 1000, status: "distributed" },
        error: null,
      });

    const service = new RoyaltyService(createMockClient({ rpc }));
    const result = await service.triggerRoyaltyCycle({
      periodStart: "2026-06-01",
      periodEnd: "2026-06-30",
      totalRevenueGnf: 100_000,
    });

    expect(result.cycleId).toBe(CYCLE_ID);
    expect(rpc).toHaveBeenCalledTimes(3);
  });

  it("listRoyaltyCycles lit royalty_cycles", async () => {
    const cycles = [{ id: CYCLE_ID, status: "ready" }];
    const service = new RoyaltyService(createMockClient({ cycles }));
    const list = await service.listRoyaltyCycles(5);
    expect(list).toEqual(cycles);
  });
});
