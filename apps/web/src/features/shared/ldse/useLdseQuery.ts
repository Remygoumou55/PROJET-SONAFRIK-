"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ldseCache } from "./cache";
import { ldseEventBus } from "./event-bus";
import { useLdseBackgroundRefresh } from "./LdseProvider";

export type UseLdseQueryOptions = {
  /** TTL cache partagé (ms). Défaut 30s. */
  ttlMs?: number;
  /** Rafraîchir au focus / reconnect / visibility. */
  backgroundRefresh?: boolean;
  /** Types d'événements LDSE déclenchant un refresh. */
  refreshOnEvents?: readonly string[];
  enabled?: boolean;
};

/**
 * Hook générique LDSE — Single Source of Truth côté client.
 * Déduplique via cache partagé ; invalide via Event Bus.
 */
export function useLdseQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseLdseQueryOptions = {},
): {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: (next: T) => void;
} {
  const {
    ttlMs = 30_000,
    backgroundRefresh = true,
    refreshOnEvents = [],
    enabled = true,
  } = options;

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setDataState] = useState<T | undefined>(() =>
    enabled ? ldseCache.get<T>(key) : undefined,
  );
  const [isLoading, setIsLoading] = useState(enabled && data === undefined);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const next = await fetcherRef.current();
      ldseCache.set(key, next, ttlMs);
      setDataState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de synchronisation");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, key, ttlMs]);

  const setData = useCallback(
    (next: T) => {
      ldseCache.set(key, next, ttlMs);
      setDataState(next);
    },
    [key, ttlMs],
  );

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled) return;
    const cached = ldseCache.get<T>(key);
    if (cached !== undefined) {
      setDataState(cached);
      setIsLoading(false);
      return;
    }
    void refreshRef.current();
  }, [enabled, key]);

  useEffect(() => {
    if (!enabled) return;
    const unsubscribers = [
      ldseEventBus.subscribe("ldse.cache.invalidate", (event) => {
        const payload = event.payload;
        if (payload?.key === key) void refreshRef.current();
        else if (Array.isArray(payload?.keys) && payload.keys.includes(key)) {
          void refreshRef.current();
        }
      }),
      ...refreshOnEvents.map((eventType) =>
        ldseEventBus.subscribe(eventType, () => {
          void refreshRef.current();
        }),
      ),
    ];
    return () => {
      for (const unsub of unsubscribers) unsub();
    };
  }, [enabled, key, refreshOnEvents]);

  useLdseBackgroundRefresh(refresh, backgroundRefresh && enabled);

  return { data, isLoading, error, refresh, setData };
}

/** Publie une invalidation ciblée sur une clé LDSE. */
export function invalidateLdseQuery(key: string): void {
  ldseCache.invalidate(key);
  ldseEventBus.publish("ldse.cache.invalidate", { key });
}
