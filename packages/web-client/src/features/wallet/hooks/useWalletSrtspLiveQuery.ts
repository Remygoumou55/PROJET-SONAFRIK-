"use client";

import { useCallback, useMemo } from "react";
import {
  getWalletHubInvalidateEvents,
  shouldRefreshWalletHub,
} from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useLiveQuery } from "@sonafrik/realtime/react";

export interface UseWalletSrtspLiveQueryParams<T> {
  userId: string | null;
  queryKey: string;
  fetcher: () => Promise<T>;
  initialData?: T;
  skipInitialFetch?: boolean;
  enabled?: boolean;
}

/** Wallet Hub — useLiveQuery SSOT (invalidation interne, Phase 3.6 / Sprint 4). */
export function useWalletSrtspLiveQuery<T>(params: UseWalletSrtspLiveQueryParams<T>) {
  const invalidateEvents = useMemo(() => getWalletHubInvalidateEvents(), []);

  const shouldInvalidate = useCallback(
    (event: SrtspEvent) => {
      if (!params.userId) return false;
      return shouldRefreshWalletHub(event, { userId: params.userId });
    },
    [params.userId],
  );

  return useLiveQuery(params.queryKey, params.fetcher, invalidateEvents, {
    enabled: params.enabled !== false && Boolean(params.userId),
    initialData: params.initialData,
    skipInitialFetch: params.skipInitialFetch,
    shouldInvalidate,
  });
}
