import type { CreatorContext } from "@sonafrik/types";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { CreatorDashboardData } from "@sonafrik/types";
import { createAnalyticsService } from "./analytics/analytics.service";
import { AdminConfigRepository } from "../shared/admin-config.repository";
import { CreatorService } from "./creator.service";
import { CreatorDashboardRepository } from "./creatorDashboard.repository";
import { buildCreatorDashboardData, computeRevenueProjection } from "./creatorDashboard.presentation";

const EMPTY_STREAM_STATS = {
  total_streams: 0,
  valid_streams: 0,
  fraud_streams: 0,
  today_streams: 0,
  week_streams: 0,
  month_streams: 0,
  quarter_streams: 0,
  valid_week_streams: 0,
  valid_month_streams: 0,
  valid_rate_percent: 0,
};

const EMPTY_AUDIENCE = {
  total_followers: 0,
  artist_followers: 0,
  creator_followers: 0,
  new_followers_7d: 0,
  new_followers_30d: 0,
  total_track_likes: 0,
  total_album_favorites: 0,
  playlist_followers: 0,
  total_engagement: 0,
  engagement_score: 0,
};

const EMPTY_REVENUE = {
  total_royalties_gnf: 0,
  paid_royalties_gnf: 0,
  pending_royalties_gnf: 0,
  wallet_balance_gnf: 0,
  total_credited_gnf: 0,
  valid_listen_count: 0,
  avg_gnf_per_listen: 0,
  month_valid_streams: 0,
  estimated_monthly_gnf: 0,
};

export class CreatorDashboardService {
  private readonly creatorService: CreatorService;
  private readonly analyticsService: ReturnType<typeof createAnalyticsService>;
  private readonly dashboardRepo: CreatorDashboardRepository;
  private readonly featureFlags: AdminConfigRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.creatorService = new CreatorService(client);
    this.analyticsService = createAnalyticsService(client);
    this.dashboardRepo = new CreatorDashboardRepository(client);
    this.featureFlags = new AdminConfigRepository(client);
  }

  async getDashboardData(): Promise<CreatorDashboardData> {
    const context = await this.creatorService.getCreatorContext();
    return this.getDashboardDataForContext(context);
  }

  async getDashboardDataForContext(context: CreatorContext): Promise<CreatorDashboardData> {
    const creatorId = context.creator.id;
    const userId = context.creator.owner_id;

    const [
      streamStats,
      timeline,
      topTracks,
      audienceStats,
      revenueStats,
      catalogCounts,
      paymentConfigured,
      monthlyRevenue,
      careerOsEnabled,
    ] = await Promise.all([
      this.analyticsService.getStreamStats({ creatorId }).catch(() => EMPTY_STREAM_STATS),
      this.analyticsService.getStreamTimeline({ creatorId, days: 14 }).catch(() => []),
      this.analyticsService.getTopTracks({ creatorId, limit: 1 }).catch(() => []),
      this.analyticsService.getAudienceStats({ creatorId }).catch(() => EMPTY_AUDIENCE),
      this.analyticsService.getRevenueStats({ creatorId }).catch(() => EMPTY_REVENUE),
      this.dashboardRepo.getCatalogCounts(creatorId, userId).catch(() => ({
        tracksPublished: 0,
        albumsPublished: 0,
        playlistsCount: 0,
      })),
      this.dashboardRepo.isPaymentConfigured(userId).catch(() => false),
      this.dashboardRepo.getMonthlyRoyalties(creatorId).catch(() => []),
      this.featureFlags.isFeatureEnabled("career_os").catch(() => false),
    ]);

    const safeStreamStats = { ...EMPTY_STREAM_STATS, ...(streamStats ?? {}) };
    const safeAudienceStats = { ...EMPTY_AUDIENCE, ...(audienceStats ?? {}) };
    const safeRevenueStats = { ...EMPTY_REVENUE, ...(revenueStats ?? {}) };
    const safeCatalogCounts = {
      ...(catalogCounts ?? {}),
      tracksPublished: catalogCounts?.tracksPublished ?? 0,
      albumsPublished: catalogCounts?.albumsPublished ?? 0,
      playlistsCount: catalogCounts?.playlistsCount ?? 0,
    };

    const revenueProjectionGnf = computeRevenueProjection(
      safeStreamStats.week_streams,
      safeRevenueStats,
    );

    return buildCreatorDashboardData(
      {
        context,
        streamStats: safeStreamStats,
        timeline: timeline ?? [],
        audienceStats: safeAudienceStats,
        revenueStats: safeRevenueStats,
        topTrack: topTracks?.[0] ?? null,
        catalogCounts: safeCatalogCounts,
        playlistsCount: safeCatalogCounts.playlistsCount,
        paymentConfigured: paymentConfigured ?? false,
        inspirationArtists: [],
        monthlyRevenue: monthlyRevenue ?? [],
        revenueProjectionGnf,
      },
      { includeCareerOs: careerOsEnabled },
    );
  }
}

export function createCreatorDashboardService(client: SonafrikSupabaseClient): CreatorDashboardService {
  return new CreatorDashboardService(client);
}
