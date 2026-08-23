"use client";

import { useCallback, useMemo } from "react";
import {
  getArtistProfileHubInvalidateEvents,
  shouldRefreshArtistProfileHub,
} from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useLiveQuery } from "@sonafrik/realtime/react";

export interface UseArtistProfileSrtspLiveQueryParams<T> {
  creatorId: string;
  userId?: string;
  queryKey: string;
  fetcher: () => Promise<T>;
  initialData?: T;
  skipInitialFetch?: boolean;
  enabled?: boolean;
}

/** Artist Profile Hub — useLiveQuery SSOT (invalidation interne, Phase 3.7 / Sprint 4). */
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

  return useLiveQuery(params.queryKey, params.fetcher, invalidateEvents, {
    enabled: params.enabled !== false,
    initialData: params.initialData,
    skipInitialFetch: params.skipInitialFetch,
    shouldInvalidate,
  });
}
