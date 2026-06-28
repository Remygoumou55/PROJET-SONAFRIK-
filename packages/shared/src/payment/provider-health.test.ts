import { describe, expect, it } from "vitest";
import {
  countProductionReadyProviders,
  getPaymentProvidersHealth,
  isProviderSandbox,
} from "./provider-health";

describe("payment provider health", () => {
  it("sandbox si clé API absente", () => {
    expect(isProviderSandbox("wave_gn", {})).toBe(true);
    expect(isProviderSandbox("wave_gn", { WAVE_API_KEY: "sk_test" })).toBe(false);
  });

  it("respecte le flag *_SANDBOX explicite", () => {
    expect(
      isProviderSandbox("orange_money_gn", {
        ORANGE_MONEY_API_KEY: "prod-key",
        ORANGE_MONEY_GN_SANDBOX: "true",
      }),
    ).toBe(true);
  });

  it("liste les 4 providers GN", () => {
    const health = getPaymentProvidersHealth({});
    expect(health).toHaveLength(4);
    expect(health.every((p) => p.mode === "sandbox")).toBe(true);
  });

  it("compte les providers prod configurés", () => {
    const count = countProductionReadyProviders({
      WAVE_API_KEY: "k1",
      MTN_MOMO_API_KEY: "k2",
    });
    expect(count).toBe(2);
  });
});
