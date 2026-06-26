import type { ListenerPremiumPlan, SubscriptionPlan } from "@sonafrik/types";
import { PREMIUM_BILLING_SLUGS } from "@sonafrik/types";

/** Mappe les lignes DB vers les plans premium auditeur (mensuel / annuel). */
export function mapDbPlansToListenerPremium(plans: SubscriptionPlan[]): ListenerPremiumPlan[] {
  const bySlug = new Map(plans.map((plan) => [plan.slug, plan]));
  const result: ListenerPremiumPlan[] = [];

  for (const [billingPeriod, meta] of Object.entries(PREMIUM_BILLING_SLUGS) as Array<
    [keyof typeof PREMIUM_BILLING_SLUGS, (typeof PREMIUM_BILLING_SLUGS)[keyof typeof PREMIUM_BILLING_SLUGS]]
  >) {
    const dbPlan = bySlug.get(meta.slug);
    if (!dbPlan) continue;

    result.push({
      id: dbPlan.id,
      billingPeriod,
      planType: meta.planType,
      label: dbPlan.name || meta.label,
      priceGnf: dbPlan.price_gnf,
      durationDays: meta.durationDays,
      slug: dbPlan.slug,
    });
  }

  return result.sort((a, b) => {
    const order = { monthly: 0, annual: 1 } as const;
    return order[a.billingPeriod] - order[b.billingPeriod];
  });
}

/** Calcule le % d'économie annuel vs 12× mensuel (null si données insuffisantes). */
export function computeAnnualSavingsPercent(plans: ListenerPremiumPlan[]): number | null {
  const monthly = plans.find((p) => p.billingPeriod === "monthly");
  const annual = plans.find((p) => p.billingPeriod === "annual");
  if (!monthly || !annual || monthly.priceGnf <= 0) return null;
  const yearlyAtMonthly = monthly.priceGnf * 12;
  if (yearlyAtMonthly <= annual.priceGnf) return null;
  return Math.round((1 - annual.priceGnf / yearlyAtMonthly) * 100);
}
