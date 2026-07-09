import { describe, expect, it, vi } from "vitest";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
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
});
