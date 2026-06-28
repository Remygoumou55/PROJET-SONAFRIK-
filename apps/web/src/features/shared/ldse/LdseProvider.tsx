"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ldseCache } from "./cache";
import { ldseEventBus } from "./event-bus";
import { resolveInvalidationKeys } from "./invalidate-map";
import type { LdseEvent, LdseOptimisticPatch } from "./types";

type LdseContextValue = {
  publish: typeof ldseEventBus.publish;
  invalidate: (keys: string | string[]) => void;
  getCached: <T>(key: string) => T | undefined;
  setCached: <T>(key: string, data: T, ttlMs?: number) => void;
  applyOptimistic: <T>(patch: LdseOptimisticPatch<T>) => () => void;
};

const LdseContext = createContext<LdseContextValue | null>(null);

export function LdseProvider({ children }: { children: ReactNode }) {
  const invalidate = useCallback((keys: string | string[]) => {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const key of list) ldseCache.invalidate(key);
  }, []);

  const applyOptimistic = useCallback(<T,>(patch: LdseOptimisticPatch<T>) => {
    const previous = ldseCache.peek<T>(patch.key);
    const next = patch.apply(previous);
    ldseCache.set(patch.key, next, 120_000);
    return () => {
      if (patch.rollback) patch.rollback(previous);
      if (previous === undefined) ldseCache.invalidate(patch.key);
      else ldseCache.set(patch.key, previous, 120_000);
    };
  }, []);

  const value = useMemo<LdseContextValue>(
    () => ({
      publish: ldseEventBus.publish,
      invalidate,
      getCached: ldseCache.get,
      setCached: ldseCache.set,
      applyOptimistic,
    }),
    [invalidate, applyOptimistic],
  );

  useEffect(() => {
    return ldseEventBus.subscribeAll((event: LdseEvent) => {
      const keys = resolveInvalidationKeys(event.type);
      if (keys.length > 0) invalidate(keys);
    });
  }, [invalidate]);

  return <LdseContext.Provider value={value}>{children}</LdseContext.Provider>;
}

export function useLdse(): LdseContextValue {
  const ctx = useContext(LdseContext);
  if (!ctx) {
    throw new Error("useLdse must be used within LdseProvider");
  }
  return ctx;
}

/** Hook optionnel — no-op si hors provider (composants legacy). */
export function useLdseOptional(): LdseContextValue | null {
  return useContext(LdseContext);
}

/** Rafraîchissement ciblé au focus / reconnect / visibility. */
export function useLdseBackgroundRefresh(onRefresh: () => void, enabled = true): void {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const trigger = () => onRefreshRef.current();

    const onVisibility = () => {
      if (document.visibilityState === "visible") trigger();
    };

    window.addEventListener("focus", trigger);
    window.addEventListener("online", trigger);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", trigger);
      window.removeEventListener("online", trigger);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);
}

/** S'abonne à un type d'événement LDSE */
export function useLdseEvent(eventType: string, handler: (event: LdseEvent) => void): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return ldseEventBus.subscribe(eventType, (event) => handlerRef.current(event));
  }, [eventType]);
}

/** État synchronisé avec le cache LDSE + refresh externe */
export function useLdseSyncedState<T>(
  key: string,
  initial: T,
  refreshFn?: () => Promise<T | undefined>,
): [T, (next: T) => void, () => Promise<void>] {
  const [value, setValue] = useState<T>(() => ldseCache.get<T>(key) ?? initial);

  const refresh = useCallback(async () => {
    if (!refreshFn) return;
    const next = await refreshFn();
    if (next !== undefined) {
      ldseCache.set(key, next);
      setValue(next);
    }
  }, [key, refreshFn]);

  const commit = useCallback(
    (next: T) => {
      ldseCache.set(key, next);
      setValue(next);
    },
    [key],
  );

  useLdseEvent("ldse.cache.invalidate", () => {
    const cached = ldseCache.get<T>(key);
    if (cached !== undefined) setValue(cached);
  });

  return [value, commit, refresh];
}
