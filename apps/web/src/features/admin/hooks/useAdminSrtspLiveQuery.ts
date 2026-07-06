"use client";

import { useCallback, useMemo } from "react";
import { getAdminHubInvalidateEvents } from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useLiveQuery } from "@sonafrik/realtime/react";

export interface UseAdminSrtspLiveQueryParams<T> {
  queryKey: string;
  fetcher: () => Promise<T>;
  initialData?: T;
  skipInitialFetch?: boolean;
  enabled?: boolean;
  shouldInvalidate: (event: SrtspEvent) => boolean;
}

/** Super Admin Hub — useLiveQuery SSOT (invalidation interne, Phase 3.9 / Sprint 4). */
export function useAdminSrtspLiveQuery<T>(params: UseAdminSrtspLiveQueryParams<T>) {
  const invalidateEvents = useMemo(() => getAdminHubInvalidateEvents(), []);
  const shouldInvalidateFn = params.shouldInvalidate;

  const shouldInvalidate = useCallback(
    (event: SrtspEvent) => shouldInvalidateFn(event),
    [shouldInvalidateFn],
  );

  return useLiveQuery(params.queryKey, params.fetcher, invalidateEvents, {
    enabled: params.enabled !== false,
    initialData: params.initialData,
    skipInitialFetch: params.skipInitialFetch,
    shouldInvalidate,
  });
}
