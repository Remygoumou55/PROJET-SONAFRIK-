import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@sonafrik/database";
import { RoyaltyRepository } from "./royalty.repository";

function createMockClient(rpcHandlers: Record<string, () => unknown>): SupabaseClient<Database> {
  const rpc = vi.fn((name: string) => {
    const handler = rpcHandlers[name];
    if (!handler) {
      return Promise.resolve({ data: null, error: new Error(`rpc_missing:${name}`) });
    }
    return handler();
  });

  const from = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  }));

  return { rpc, from } as unknown as SupabaseClient<Database>;
}

describe("RoyaltyRepository", () => {
  it("openRoyaltyCycle retourne l'id du cycle", async () => {
    const client = createMockClient({
      open_royalty_cycle: () => Promise.resolve({ data: "cycle-1", error: null }),
    });
    const repo = new RoyaltyRepository(client);
    await expect(repo.openRoyaltyCycle("2026-01-01", "2026-01-31", 1_000_000, 65)).resolves.toBe("cycle-1");
  });

  it("calculateRoyalties propage les erreurs RPC", async () => {
    const client = createMockClient({
      calculate_royalties: () => Promise.resolve({ data: null, error: new Error("calc_fail") }),
    });
    const repo = new RoyaltyRepository(client);
    await expect(repo.calculateRoyalties("cycle-1")).rejects.toThrow("calc_fail");
  });

  it("listRoyaltyCycles retourne les cycles", async () => {
    const client = createMockClient({});
    const limit = vi.fn().mockResolvedValue({
      data: [{ id: "c1", period_start: "2026-01-01" }],
      error: null,
    });
    client.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit,
    })) as typeof client.from;

    const repo = new RoyaltyRepository(client);
    const rows = await repo.listRoyaltyCycles(5);
    expect(rows).toHaveLength(1);
  });
});
