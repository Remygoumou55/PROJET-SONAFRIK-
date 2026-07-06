"use client";

import { useCallback, useMemo } from "react";
import type { CreatorDashboardData } from "@sonafrik/types";
import {
  getCreatorDashboardInvalidateEvents,
  shouldRefreshCreatorDashboard,
} from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useEventSubscription, useLiveQuery } from "@sonafrik/realtime/react";
import { useCreatorService } from "../../hooks/useCreator";

export interface UseCreatorDashboardSrtspLiveParams {
  creatorId: string;
  userId?: string;
  initialData: CreatorDashboardData;
  enabled?: boolean;
}

/** Dashboard Artiste — consommateur SRTSP officiel (Phase 3.3). */
export function useCreatorDashboardSrtspLive(params: UseCreatorDashboardSrtspLiveParams) {
  const creator = useCreatorService();
  const invalidateEvents = useMemo(() => getCreatorDashboardInvalidateEvents(), []);
  const queryKey = useMemo(
    () => `creator-dashboard:${params.creatorId}`,
    [params.creatorId],
  );

  const fetchDashboard = useCallback(async (): Promise<CreatorDashboardData> => {
    return creator.getDashboardData();
  }, [creator]);

  const shouldInvalidate = useCallback(
    (event: SrtspEvent) =>
      shouldRefreshCreatorDashboard(event, {
        creatorId: params.creatorId,
        userId: params.userId,
      }),
    [params.creatorId, params.userId],
  );

  const liveQuery = useLiveQuery(queryKey, fetchDashboard, invalidateEvents, {
    enabled: params.enabled !== false,
    initialData: params.initialData,
    skipInitialFetch: true,
    shouldInvalidate,
  });

  useEventSubscription(
    invalidateEvents,
    (event) => {
      if (
        !shouldRefreshCreatorDashboard(event, {
          creatorId: params.creatorId,
          userId: params.userId,
        })
      ) {
        return;
      }
      liveQuery.refresh();
    },
    params.enabled !== false,
  );

  return liveQuery;
}
