import { describe, expect, it, vi } from "vitest";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { PaymentProvider } from "@sonafrik/types";
import { createPaymentsService } from "./payments.service";
import { PaymentError } from "./errors";

function createMockClient(overrides: {
  invokeResult?: { data: unknown; error: unknown };
  intentRow?: Record<string, unknown> | null;
  intentList?: Record<string, unknown>[];
}): SonafrikSupabaseClient {
  const from = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: overrides.intentRow ?? null, error: null }),
  }));

  const chain = from();
  chain.limit.mockResolvedValue({ data: overrides.intentList ?? [], error: null });

  return {
    functions: {
      invoke: vi.fn().mockResolvedValue(
        overrides.invokeResult ?? {
          data: { intentId: "intent-1", sandbox: true, ussdPush: true },
          error: null,
        },
      ),
    },
    from,
  } as unknown as SonafrikSupabaseClient;
}

describe("PaymentsService", () => {
  it("initiatePayment valide le schéma et retourne instructions", async () => {
    const client = createMockClient({});
    const service = createPaymentsService(client);

    const result = await service.initiatePayment({
      provider: "orange_money_gn",
      purpose: "topup",
      amountGnf: 10_000,
      phone: "+224620000000",
    });

    expect(result.intentId).toBe("intent-1");
    expect(result.sandbox).toBe(true);
    expect(result.instructions).toContain("sandbox");
  });

  it("initiatePayment rejette un montant invalide", async () => {
    const service = createPaymentsService(createMockClient({}));
    await expect(service.initiatePayment({
      provider: "wave_gn",
      purpose: "topup",
      amountGnf: 100,
      phone: "+224620000000",
    })).rejects.toBeInstanceOf(PaymentError);
  });

  it("initiatePayment traduit unauthorized", async () => {
    const service = createPaymentsService(createMockClient({
      invokeResult: {
        data: null,
        error: { message: "unauthorized" },
      },
    }));

    await expect(service.initiatePayment({
      provider: "mtn_momo_gn",
      purpose: "topup",
      amountGnf: 5_000,
      phone: "+224620000000",
    })).rejects.toMatchObject({ code: "unauthorized" });
  });

  it("initiatePayment échoue sans intentId", async () => {
    const service = createPaymentsService(createMockClient({
      invokeResult: {
        data: { error: "provider_down" },
        error: null,
      },
    }));

    await expect(service.initiatePayment({
      provider: "wave_gn",
      purpose: "topup",
      amountGnf: 5_000,
      phone: "+224620000000",
    })).rejects.toMatchObject({ code: "provider_error" });
  });

  it("getIntent retourne la ligne payment_intents", async () => {
    const row = { id: "intent-1", status: "pending", amount_gnf: 5000 };
    const service = createPaymentsService(createMockClient({ intentRow: row }));
    const intent = await service.getIntent("intent-1");
    expect(intent).toEqual(row);
  });

  it("getIntent propage l'erreur DB", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "db" } });
    const client = {
      functions: { invoke: vi.fn() },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle,
      })),
    } as unknown as SonafrikSupabaseClient;
    const service = createPaymentsService(client);
    await expect(service.getIntent("intent-1")).rejects.toMatchObject({ code: "intent_fetch_failed" });
  });

  it("listUserIntents propage l'erreur DB", async () => {
    const limit = vi.fn().mockResolvedValue({ data: null, error: { message: "db" } });
    const eq = vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit }) });
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      functions: { invoke: vi.fn() },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq,
        order: vi.fn().mockReturnThis(),
        limit,
      })),
    } as unknown as SonafrikSupabaseClient;

    const service = createPaymentsService(client);
    await expect(service.listUserIntents()).rejects.toBeInstanceOf(PaymentError);
  });

  it("initiatePayment traduit invalid_provider", async () => {
    const service = createPaymentsService(createMockClient({
      invokeResult: {
        data: null,
        error: { message: "invalid_provider" },
      },
    }));

    await expect(service.initiatePayment({
      provider: "invalid_provider" as unknown as PaymentProvider,
      purpose: "topup",
      amountGnf: 5_000,
      phone: "+224620000000",
    })).rejects.toMatchObject({ code: "invalid_provider" });
  });

  it("initiatePayment traduit invalid_amount", async () => {
    const service = createPaymentsService(createMockClient({
      invokeResult: {
        data: null,
        error: { message: "invalid_amount" },
      },
    }));

    await expect(service.initiatePayment({
      provider: "wave_gn",
      purpose: "topup",
      amountGnf: 5_000,
      phone: "+224620000000",
    })).rejects.toMatchObject({ code: "invalid_amount" });
  });

  it("initiatePayment traduit wallet_not_found", async () => {
    const service = createPaymentsService(createMockClient({
      invokeResult: {
        data: null,
        error: { message: "wallet_not_found" },
      },
    }));

    await expect(service.initiatePayment({
      provider: "orange_money_gn",
      purpose: "topup",
      amountGnf: 5_000,
      phone: "+224620000000",
    })).rejects.toMatchObject({ code: "provider_error" });
  });

  it("initiatePayment avec Wave retourne checkoutUrl", async () => {
    const service = createPaymentsService(createMockClient({
      invokeResult: {
        data: { intentId: "intent-1", sandbox: false, checkoutUrl: "https://pay.wave.com/xyz" },
        error: null,
      },
    }));

    const result = await service.initiatePayment({
      provider: "wave_gn",
      purpose: "topup",
      amountGnf: 10_000,
      phone: "+224620000000",
    });

    expect(result.checkoutUrl).toBe("https://pay.wave.com/xyz");
    expect(result.instructions).toContain("page Wave");
  });

  it("initiatePayment avec Orange Money génère instructions USSD", async () => {
    const service = createPaymentsService(createMockClient({
      invokeResult: {
        data: { intentId: "intent-1", sandbox: false, ussdPush: true },
        error: null,
      },
    }));

    const result = await service.initiatePayment({
      provider: "orange_money_gn",
      purpose: "topup",
      amountGnf: 10_000,
      phone: "+224620000000",
    });

    expect(result.ussdPush).toBe(true);
    expect(result.instructions).toContain("#144#");
  });

  it("initiatePayment avec MTN MoMo génère instructions push", async () => {
    const service = createPaymentsService(createMockClient({
      invokeResult: {
        data: { intentId: "intent-1", sandbox: false, ussdPush: true },
        error: null,
      },
    }));

    const result = await service.initiatePayment({
      provider: "mtn_momo_gn",
      purpose: "topup",
      amountGnf: 5_000,
      phone: "+224620000000",
    });

    expect(result.ussdPush).toBe(true);
    expect(result.instructions).toContain("MTN");
  });

  it("listUserIntents retourne tableau vide si non authentifié", async () => {
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: "unauthorized" } }),
      },
      functions: { invoke: vi.fn() },
      from: vi.fn(),
    } as unknown as SonafrikSupabaseClient;

    const service = createPaymentsService(client);
    const intents = await service.listUserIntents();
    expect(intents).toEqual([]);
  });
});
