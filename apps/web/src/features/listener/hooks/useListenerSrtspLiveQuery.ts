"use client";

import { useCallback, useMemo } from "react";
import { getListenerHubInvalidateEvents } from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useEventSubscription, useLiveQuery } from "@sonafrik/realtime/react";

export interface ListenerHubScope {
  userId?: string;
  creatorId?: string;
}

export interface UseListenerSrtspLiveQueryParams<T> {
  queryKey: string;
  fetcher: () => Promise<T>;
  initialData?: T;
  skipInitialFetch?: boolean;
  enabled?: boolean;
  scope?: ListenerHubScope;
  shouldInvalidate: (event: SrtspEvent, scope: ListenerHubScope) => boolean;
}

/** Workspace Auditeur — useLiveQuery + useEventSubscription (Phase 3.8 SSOT). */
export function useListenerSrtspLiveQuery<T>(params: UseListenerSrtspLiveQueryParams<T>) {
  const invalidateEvents = useMemo(() => getListenerHubInvalidateEvents(), []);
  const scope = useMemo(
    () => ({ userId: params.scope?.userId, creatorId: params.scope?.creatorId }),
    [params.scope?.userId, params.scope?.creatorId],
  );
  const shouldInvalidateFn = params.shouldInvalidate;

  const shouldInvalidate = useCallback(
    (event: SrtspEvent) => shouldInvalidateFn(event, scope),
    [shouldInvalidateFn, scope],
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
      if (!shouldInvalidateFn(event, scope)) return;
      liveQuery.refresh();
    },
    params.enabled !== false,
  );

  return liveQuery;
}
