"use client";

import { useCallback, useEffect, useState } from "react";
import { useNotificationsService } from "@/features/shared/notifications/hooks/useNotificationsService";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import { ldseCache } from "../cache";
import { ldseEventBus } from "../event-bus";
import {
  NOTIFICATIONS_LDSE_EVENTS,
  NOTIFICATIONS_LDSE_KEYS,
} from "./notifications-ldse-config";
import { useLdseEvent } from "../LdseProvider";

/** Compteur notifications synchronisé — Realtime + Event Bus LDSE */
export function useNotificationsLdseCount(userId: string, initialCount: number) {
  const cacheKey = NOTIFICATIONS_LDSE_KEYS.unreadCount(userId);
  const notifications = useNotificationsService();
  const [count, setCount] = useState(() => ldseCache.get<number>(cacheKey) ?? initialCount);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const next = await notifications.countUnread(userId);
    ldseCache.set(cacheKey, next, 30_000);
    setCount(next);
  }, [cacheKey, notifications, userId]);

  useRealtimeChannel(
    `notif_ldse_${userId}`,
    [
      {
        event: "INSERT",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
        onEvent: () => {
          setCount((prev) => {
            const next = prev + 1;
            ldseCache.set(cacheKey, next, 30_000);
            return next;
          });
          ldseEventBus.publish(NOTIFICATIONS_LDSE_EVENTS.created, { userId });
        },
      },
      {
        event: "UPDATE",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
        onEvent: () => {
          void refresh();
          ldseEventBus.publish(NOTIFICATIONS_LDSE_EVENTS.updated, { userId });
        },
      },
    ],
    !!userId,
  );

  useLdseEvent(NOTIFICATIONS_LDSE_EVENTS.read, (event) => {
    if (event.payload?.userId === userId) void refresh();
  });

  useLdseEvent(NOTIFICATIONS_LDSE_EVENTS.readAll, (event) => {
    if (event.payload?.userId === userId) {
      ldseCache.set(cacheKey, 0, 30_000);
      setCount(0);
    }
  });

  useEffect(() => {
    ldseCache.set(cacheKey, initialCount, 30_000);
    setCount(initialCount);
  }, [cacheKey, initialCount]);

  return { count, refresh, setCount };
}

export function publishNotificationLdseEvent(
  type: (typeof NOTIFICATIONS_LDSE_EVENTS)[keyof typeof NOTIFICATIONS_LDSE_EVENTS],
  userId: string,
  payload?: Record<string, unknown>,
): void {
  ldseEventBus.publish(type, { userId, ...payload });
}
