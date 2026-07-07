import { requireCreatorContext } from "@/features/creator/lib/requireCreator";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createAnalyticsService } from "@sonafrik/api/analytics";
import { createRoyaltyService } from "@sonafrik/api/royalties";
import { CreatorAnalyticsDashboardShell } from "@/features/creator/analytics/components/CreatorAnalyticsDashboardShell";
import type { CreatorAnalyticsData } from "@sonafrik/types";

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

export default async function CreatorAnalyticsPage() {
  const context = await requireCreatorContext();
  const creatorId = context.creator.id;
  const supabase = await getSupabaseServerClient();
  const analytics = createAnalyticsService(supabase);
  const royalties = createRoyaltyService(supabase);

  const [
    streamStats,
    timeline,
    topTracks,
    topAlbums,
    audienceStats,
    revenueStats,
    royaltyHistory,
  ] = await Promise.allSettled([
    analytics.getStreamStats({ creatorId }),
    analytics.getStreamTimeline({ creatorId, days: 90 }),
    analytics.getTopTracks({ creatorId, limit: 10 }),
    analytics.getTopAlbums({ creatorId, limit: 10 }),
    analytics.getAudienceStats({ creatorId }),
    analytics.getRevenueStats({ creatorId }),
    royalties.getCreatorRoyaltyHistory({ creatorId, limit: 12 }),
  ]);

  const data: CreatorAnalyticsData = {
    streamStats:
      streamStats.status === "fulfilled"
        ? { ...EMPTY_STREAM_STATS, ...streamStats.value }
        : EMPTY_STREAM_STATS,
    timeline: timeline.status === "fulfilled" ? timeline.value : [],
    topTracks: topTracks.status === "fulfilled" ? topTracks.value : [],
    topAlbums: topAlbums.status === "fulfilled" ? topAlbums.value : [],
    audienceStats:
      audienceStats.status === "fulfilled"
        ? { ...EMPTY_AUDIENCE, ...audienceStats.value }
        : EMPTY_AUDIENCE,
    revenueStats:
      revenueStats.status === "fulfilled"
        ? { ...EMPTY_REVENUE, ...revenueStats.value }
        : EMPTY_REVENUE,
    royaltyHistory:
      royaltyHistory.status === "fulfilled" ? royaltyHistory.value : [],
  };

  return <CreatorAnalyticsDashboardShell data={data} creatorId={creatorId} />;
}
