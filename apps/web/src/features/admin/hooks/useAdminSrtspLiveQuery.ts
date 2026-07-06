"use client";

import { useCallback, useMemo } from "react";
import { getAdminHubInvalidateEvents } from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useEventSubscription, useLiveQuery } from "@sonafrik/realtime/react";

export interface UseAdminSrtspLiveQueryParams<T> {
  queryKey: string;
  fetcher: () => Promise<T>;
  initialData?: T;
  skipInitialFetch?: boolean;
  enabled?: boolean;
  shouldInvalidate: (event: SrtspEvent) => boolean;
}

/** Super Admin Hub — useLiveQuery + useEventSubscription (Phase 3.9 SSOT). */
export function useAdminSrtspLiveQuery<T>(params: UseAdminSrtspLiveQueryParams<T>) {
  const invalidateEvents = useMemo(() => getAdminHubInvalidateEvents(), []);
  const shouldInvalidateFn = params.shouldInvalidate;

  const shouldInvalidate = useCallback(
    (event: SrtspEvent) => shouldInvalidateFn(event),
    [shouldInvalidateFn],
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
      if (!shouldInvalidateFn(event)) return;
      liveQuery.refresh();
    },
    params.enabled !== false,
  );

  return liveQuery;
}
