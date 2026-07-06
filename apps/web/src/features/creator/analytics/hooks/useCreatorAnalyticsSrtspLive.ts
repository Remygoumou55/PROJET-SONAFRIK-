"use client";

import { useCallback, useMemo } from "react";
import type { CreatorAnalyticsData } from "@sonafrik/types";
import {
  getCreatorAnalyticsInvalidateEvents,
  shouldRefreshCreatorAnalytics,
} from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useLiveQuery } from "@sonafrik/realtime/react";
import { useAnalyticsServices } from "./useAnalytics";

const TIMELINE_DAYS = 30;
const TOP_LIMIT = 10;
const ROYALTY_HISTORY_LIMIT = 12;

export interface UseCreatorAnalyticsSrtspLiveParams {
  creatorId: string;
  initialData: CreatorAnalyticsData;
  enabled?: boolean;
}

/** Analytics Créateur — consommateur SRTSP officiel (Phase 3.5). */
export function useCreatorAnalyticsSrtspLive(params: UseCreatorAnalyticsSrtspLiveParams) {
  const { analytics, royalties } = useAnalyticsServices();
  const invalidateEvents = useMemo(() => getCreatorAnalyticsInvalidateEvents(), []);
  const queryKey = useMemo(() => `creator-analytics:${params.creatorId}`, [params.creatorId]);

  const fetchAnalytics = useCallback(async (): Promise<CreatorAnalyticsData> => {
    const input = { creatorId: params.creatorId };
    const [
      streamStats,
      timeline,
      topTracks,
      topAlbums,
      audienceStats,
      revenueStats,
      royaltyHistory,
    ] = await Promise.all([
      analytics.getStreamStats(input),
      analytics.getStreamTimeline({ creatorId: params.creatorId, days: TIMELINE_DAYS }),
      analytics.getTopTracks({ creatorId: params.creatorId, limit: TOP_LIMIT }),
      analytics.getTopAlbums({ creatorId: params.creatorId, limit: TOP_LIMIT }),
      analytics.getAudienceStats(input),
      analytics.getRevenueStats(input),
      royalties.getCreatorRoyaltyHistory({ creatorId: params.creatorId, limit: ROYALTY_HISTORY_LIMIT }),
    ]);
    return {
      streamStats,
      timeline,
      topTracks,
      topAlbums,
      audienceStats,
      revenueStats,
      royaltyHistory,
    };
  }, [analytics, royalties, params.creatorId]);

  const shouldInvalidate = useCallback(
    (event: SrtspEvent) => shouldRefreshCreatorAnalytics(event, { creatorId: params.creatorId }),
    [params.creatorId],
  );

  return useLiveQuery(queryKey, fetchAnalytics, invalidateEvents, {
    enabled: params.enabled !== false,
    initialData: params.initialData,
    skipInitialFetch: true,
    shouldInvalidate,
  });
}
