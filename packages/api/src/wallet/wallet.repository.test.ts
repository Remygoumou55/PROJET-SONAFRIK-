import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@sonafrik/database";
import { WalletRepository } from "./wallet.repository";

function createMockClient(tableHandlers: Record<string, () => unknown>): SupabaseClient<Database> {
  const from = vi.fn((table: string) => {
    const handler = tableHandlers[table];
    if (!handler) {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      };
    }
    return handler();
  });
  return { from } as unknown as SupabaseClient<Database>;
}

describe("WalletRepository", () => {
  it("getWallet retourne null si absent", async () => {
    const client = createMockClient({
      wallets: () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      }),
    });
    const repo = new WalletRepository(client);
    await expect(repo.getWallet("user-1")).resolves.toBeNull();
  });

  it("getLedger propage les erreurs DB", async () => {
    const client = createMockClient({
      wallet_ledger: () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: new Error("db_fail") }),
      }),
    });
    const repo = new WalletRepository(client);
    await expect(repo.getLedger("user-1")).rejects.toThrow("db_fail");
  });

  it("getWithdrawals retourne un tableau", async () => {
    const client = createMockClient({
      withdrawals: () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [{ id: "w1" }], error: null }),
      }),
    });
    const repo = new WalletRepository(client);
    const rows = await repo.getWithdrawals("user-1");
    expect(rows).toHaveLength(1);
  });
});
