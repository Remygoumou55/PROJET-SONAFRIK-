import type { CreatorDashboardData, CreatorRevenueStats } from "@sonafrik/types";
import { buildActivities } from "./creatorDashboard.activities.presentation";
import { buildHero } from "./creatorDashboard.hero.presentation";
import { buildKpis } from "./creatorDashboard.kpis.presentation";
import type { BuildDashboardInput } from "./creatorDashboard.presentation.shared";
import {
  buildAssistantTips,
  buildCareerSteps,
  buildGoals,
  buildQuickActions,
} from "./creatorDashboard.widgets.presentation";

export type { BuildDashboardInput } from "./creatorDashboard.presentation.shared";

export function computeRevenueProjection(
  weeklyStreams: number,
  revenueStats: CreatorRevenueStats,
): number | null {
  if (weeklyStreams <= 0) return null;

  let perStream = revenueStats.avg_gnf_per_listen;
  if (perStream <= 0 && revenueStats.month_valid_streams > 0 && revenueStats.estimated_monthly_gnf > 0) {
    perStream = revenueStats.estimated_monthly_gnf / revenueStats.month_valid_streams;
  }
  if (perStream <= 0) return null;

  return Math.round(weeklyStreams * 4 * perStream);
}

export function buildCreatorDashboardData(input: BuildDashboardInput): CreatorDashboardData {
  const hero = buildHero(input);
  return {
    context: input.context,
    hero,
    kpis: buildKpis(input),
    activities: buildActivities(input),
    goals: buildGoals(input),
    careerSteps: buildCareerSteps(input),
    assistantTips: buildAssistantTips(input, hero.profilePercent),
    quickActions: buildQuickActions(input),
    streamStats: input.streamStats,
    timeline: input.timeline,
    topTrack: input.topTrack,
    revenueStats: input.revenueStats,
    catalogCounts: input.catalogCounts,
    paymentConfigured: input.paymentConfigured,
    profileSlug: input.context.artistProfile.slug,
    inspirationArtists: input.inspirationArtists,
    monthlyRevenue: input.monthlyRevenue,
    revenueProjectionGnf: input.revenueProjectionGnf,
    profileCreatedAt: input.context.creator.created_at,
  };
}
