import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@sonafrik/database";
import { WalletService } from "./wallet.service";
import { WalletError } from "./errors";

function createMockClient(overrides: {
  rpc?: ReturnType<typeof vi.fn>;
  authUser?: { id: string } | null;
  subscriptionPlans?: Array<Record<string, unknown>>;
  profile?: Record<string, unknown> | null;
  wallet?: Record<string, unknown> | null;
  transactions?: unknown[];
  withdrawals?: unknown[];
}): SupabaseClient<Database> {
  const from = vi.fn((table: string) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      range: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    if (table === "subscription_plans") {
      chain.order.mockResolvedValue({
        data: overrides.subscriptionPlans ?? [
          { id: "p1", name: "Premium", slug: "premium", price_gnf: 50_000, features: {}, is_active: true, sort_order: 1 },
          { id: "p2", name: "Premium Annuel", slug: "premium-annual", price_gnf: 480_000, features: {}, is_active: true, sort_order: 2 },
        ],
        error: null,
      });
    }

    if (table === "profiles") {
      chain.single.mockResolvedValue({
        data: overrides.profile ?? { is_premium: false, premium_expires_at: null, created_at: new Date().toISOString() },
        error: null,
      });
    }

    if (table === "wallets") {
      chain.single.mockResolvedValue({
        data: overrides.wallet ?? { id: "w1", user_id: "u1", balance_gnf: 100_000, currency: "GNF", total_credited_gnf: 0, total_debited_gnf: 0, created_at: "", updated_at: "" },
        error: null,
      });
    }

    if (table === "transactions") {
      chain.range.mockResolvedValue({ data: overrides.transactions ?? [], error: null });
    }

    if (table === "withdrawals") {
      chain.range.mockResolvedValue({ data: overrides.withdrawals ?? [], error: null });
    }

    return chain;
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: overrides.authUser ?? { id: "u1" } },
        error: null,
      }),
    },
    from,
    rpc: overrides.rpc ?? vi.fn(),
  } as unknown as SupabaseClient<Database>;
}

describe("WalletService", () => {
  it("getListenerPremiumPlans retourne les plans mappés depuis la DB", async () => {
    const service = new WalletService(createMockClient({}));
    const plans = await service.getListenerPremiumPlans();

    expect(plans).toHaveLength(2);
    expect(plans[0]?.planType).toBe("monthly");
    expect(plans[1]?.planType).toBe("annual");
  });

  it("getListenerPremiumPlans lève PLAN_NOT_FOUND si DB vide", async () => {
    const service = new WalletService(createMockClient({ subscriptionPlans: [] }));
    await expect(service.getListenerPremiumPlans()).rejects.toMatchObject({
      code: "PLAN_NOT_FOUND",
    });
  });

  it("subscribePremium délègue au RPC et retourne le résultat", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { success: true, expires_at: "2026-07-01T00:00:00Z", amount_debited_gnf: 50_000 },
      error: null,
    });
    const service = new WalletService(createMockClient({ rpc }));

    const result = await service.subscribePremium({ planType: "monthly" });

    expect(rpc).toHaveBeenCalledWith("subscribe_premium", { p_plan_type: "monthly" });
    expect(result).toEqual({
      expiresAt: "2026-07-01T00:00:00Z",
      amountDebitedGnf: 50_000,
    });
  });

  it("subscribePremium traduit insufficient_balance", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "insufficient_balance" },
    });
    const service = new WalletService(createMockClient({ rpc }));

    await expect(service.subscribePremium({ planType: "monthly" })).rejects.toBeInstanceOf(WalletError);
    await expect(service.subscribePremium({ planType: "monthly" })).rejects.toMatchObject({
      code: "INSUFFICIENT_BALANCE",
    });
  });

  it("subscribePremium traduit plan_not_found", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "plan_not_found" },
    });
    const service = new WalletService(createMockClient({ rpc }));

    await expect(service.subscribePremium({ planType: "annual" })).rejects.toMatchObject({
      code: "PLAN_NOT_FOUND",
    });
  });

  it("subscribePremium traduit wallet_not_found", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "wallet_not_found" },
    });
    const service = new WalletService(createMockClient({ rpc }));

    await expect(service.subscribePremium({ planType: "monthly" })).rejects.toMatchObject({
      code: "WALLET_NOT_FOUND",
    });
  });

  it("subscribePremium rejette une réponse RPC invalide", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { success: false },
      error: null,
    });
    const service = new WalletService(createMockClient({ rpc }));

    await expect(service.subscribePremium({ planType: "monthly" })).rejects.toMatchObject({
      code: "SUBSCRIPTION_FAILED",
    });
  });

  it("topupWallet est bloqué (paiement mobile requis)", async () => {
    const service = new WalletService(createMockClient({}));
    await expect(service.topupWallet({
      amountGnf: 10_000,
      paymentMethod: "wave",
      paymentReference: "ref-1",
    })).rejects.toMatchObject({ code: "TOPUP_FAILED" });
  });

  it("getWalletContext agrège wallet, premium et retraits", async () => {
    const service = new WalletService(createMockClient({
      profile: {
        is_premium: true,
        premium_expires_at: "2030-01-01T00:00:00Z",
        created_at: new Date().toISOString(),
      },
      wallet: {
        id: "w1",
        user_id: "u1",
        balance_gnf: 250_000,
        currency: "GNF",
        total_credited_gnf: 300_000,
        total_debited_gnf: 50_000,
        created_at: "",
        updated_at: "",
      },
      withdrawals: [{ status: "pending" }, { status: "completed" }],
    }));

    const ctx = await service.getWalletContext();
    expect(ctx.wallet.balance_gnf).toBe(250_000);
    expect(ctx.isPremium).toBe(true);
    expect(ctx.pendingWithdrawals).toBe(1);
  });

  it("getBalance délègue get_wallet_balance", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 42_000, error: null });
    const service = new WalletService(createMockClient({ rpc }));

    const balance = await service.getBalance();
    expect(balance).toBe(42_000);
    expect(rpc).toHaveBeenCalledWith("get_wallet_balance", { p_user_id: "u1" });
  });

  it("requestWithdrawal traduit insufficient_balance", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "insufficient_balance" },
    });
    const service = new WalletService(createMockClient({ rpc }));

    await expect(service.requestWithdrawal({
      payoutAccountId: "44444444-4444-4444-8444-444444444444",
      amountGnf: 10_000,
    })).rejects.toMatchObject({ code: "INSUFFICIENT_BALANCE" });
  });
});
