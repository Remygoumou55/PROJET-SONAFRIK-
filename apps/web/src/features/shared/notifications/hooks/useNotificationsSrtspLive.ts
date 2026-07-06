"use client";

import { useCallback, useMemo } from "react";
import type { Notification } from "@sonafrik/types";
import { getListenerHubInvalidateEvents, shouldRefreshListenerNotifications } from "@sonafrik/realtime/adapters";
import type { SrtspEvent } from "@sonafrik/realtime";
import { useLiveQuery } from "@sonafrik/realtime/react";
import { useNotificationsService } from "./useNotificationsService";

export interface UseNotificationsSrtspLiveParams {
  userId: string;
  initialData: Notification[];
  enabled?: boolean;
}

/** Notifications — consommateur SRTSP partagé (settings + /notifications). */
export function useNotificationsSrtspLive(params: UseNotificationsSrtspLiveParams) {
  const service = useNotificationsService();
  const scope = useMemo(() => ({ userId: params.userId }), [params.userId]);
  const invalidateEvents = useMemo(() => getListenerHubInvalidateEvents(), []);

  const fetchNotifications = useCallback(async (): Promise<Notification[]> => {
    return service.listNotifications({ userId: params.userId, limit: 50 });
  }, [service, params.userId]);

  const shouldInvalidate = useCallback(
    (event: SrtspEvent) => shouldRefreshListenerNotifications(event, scope),
    [scope],
  );

  return useLiveQuery(`notifications:${params.userId}`, fetchNotifications, invalidateEvents, {
    enabled: params.enabled !== false,
    initialData: params.initialData,
    skipInitialFetch: true,
    shouldInvalidate,
  });
}
