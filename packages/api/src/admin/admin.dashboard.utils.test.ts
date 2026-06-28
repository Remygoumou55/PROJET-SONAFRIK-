import { describe, expect, it } from "vitest";
import {
  bucketMonthlyWalletCredits,
  buildMonthKeys,
  computeRevenueChangePercent,
  sumWalletCreditGnf,
} from "./admin.dashboard.utils";

describe("admin.dashboard.utils", () => {
  it("sumWalletCreditGnf adds credit amounts only", () => {
    expect(
      sumWalletCreditGnf([
        { amount_gnf: 1000 },
        { amount_gnf: 2500 },
      ]),
    ).toBe(3500);
  });

  it("computeRevenueChangePercent returns null when previous is zero", () => {
    expect(computeRevenueChangePercent(100, 0)).toBeNull();
  });

  it("computeRevenueChangePercent computes month-over-month delta", () => {
    expect(computeRevenueChangePercent(150, 100)).toBe("50.0");
    expect(computeRevenueChangePercent(80, 100)).toBe("-20.0");
  });

  it("bucketMonthlyWalletCredits groups rows by month key", () => {
    const keys = ["2026-05", "2026-06"];
    const map = bucketMonthlyWalletCredits(
      [
        { amount_gnf: 1000, created_at: "2026-05-10T12:00:00.000Z" },
        { amount_gnf: 500, created_at: "2026-05-20T12:00:00.000Z" },
        { amount_gnf: 2000, created_at: "2026-06-01T12:00:00.000Z" },
      ],
      keys,
    );
    expect(map.get("2026-05")).toBe(1500);
    expect(map.get("2026-06")).toBe(2000);
  });

  it("buildMonthKeys returns consecutive month keys", () => {
    const keys = buildMonthKeys(new Date("2026-06-15T12:00:00.000Z"), 3);
    expect(keys).toEqual(["2026-04", "2026-05", "2026-06"]);
  });
});
