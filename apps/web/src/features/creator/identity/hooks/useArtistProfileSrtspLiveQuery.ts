"use client";

import { useCallback, useMemo } from "react";
import {
  getArtistProfileHubInvalidateEvents,
  shouldRefreshArtistProfileHub,
} from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useEventSubscription, useLiveQuery } from "@sonafrik/realtime/react";

export interface UseArtistProfileSrtspLiveQueryParams<T> {
  creatorId: string;
  userId?: string;
  queryKey: string;
  fetcher: () => Promise<T>;
  initialData?: T;
  skipInitialFetch?: boolean;
  enabled?: boolean;
}

/** Artist Profile Hub — useLiveQuery + useEventSubscription (Phase 3.7 SSOT). */
export function useArtistProfileSrtspLiveQuery<T>(params: UseArtistProfileSrtspLiveQueryParams<T>) {
  const invalidateEvents = useMemo(() => getArtistProfileHubInvalidateEvents(), []);
  const scope = useMemo(
    () => ({ creatorId: params.creatorId, userId: params.userId }),
    [params.creatorId, params.userId],
  );

  const shouldInvalidate = useCallback(
    (event: SrtspEvent) => shouldRefreshArtistProfileHub(event, scope),
    [scope],
  );

  const liveQuery = useLiveQuery(params.queryKey, params.fetcher, invalidateEvents, {
    enabled: params.enabled !== false,
    initialData: params.initialData,
    skipInitialFetch: params.skipInitialFetch,
    shouldInvalidate,
  });

  useEventSubscription(
    invalidateEvents,
    (event) => {
      if (!shouldRefreshArtistProfileHub(event, scope)) return;
      liveQuery.refresh();
    },
    params.enabled !== false,
  );

  return liveQuery;
}
