import { describe, expect, it } from "vitest";
import type { SubscriptionPlan } from "@sonafrik/types";
import { mapDbPlansToListenerPremium, computeAnnualSavingsPercent } from "./subscription-plans.mapper";

const basePlan = (slug: string, price: number, name: string): SubscriptionPlan => ({
  id: `id-${slug}`,
  name,
  slug,
  price_gnf: price,
  features: {},
  is_active: true,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

describe("mapDbPlansToListenerPremium", () => {
  it("mappe premium et premium-annual vers plans auditeur", () => {
    const plans = mapDbPlansToListenerPremium([
      basePlan("gratuit", 0, "Gratuit"),
      basePlan("premium", 50_000, "Premium"),
      basePlan("premium-annual", 480_000, "Premium Annuel"),
    ]);

    expect(plans).toHaveLength(2);
    expect(plans[0]).toMatchObject({
      billingPeriod: "monthly",
      planType: "monthly",
      priceGnf: 50_000,
      slug: "premium",
    });
    expect(plans[1]).toMatchObject({
      billingPeriod: "annual",
      planType: "annual",
      priceGnf: 480_000,
      slug: "premium-annual",
    });
  });

  it("ignore les slugs non mappés", () => {
    const plans = mapDbPlansToListenerPremium([
      basePlan("artiste", 100_000, "Artiste Pro"),
    ]);
    expect(plans).toHaveLength(0);
  });

  it("calcule l'économie annuelle", () => {
    const plans = mapDbPlansToListenerPremium([
      basePlan("premium", 50_000, "Premium"),
      basePlan("premium-annual", 480_000, "Premium Annuel"),
    ]);
    expect(computeAnnualSavingsPercent(plans)).toBe(20);
  });
});
