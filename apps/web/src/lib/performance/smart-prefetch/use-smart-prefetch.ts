"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePerformanceFlags } from "../performance-context";
import { prefetchRoute, prefetchRoutes, type PrefetchRoutesOptions } from "./prefetch-route";

export interface UseSmartPrefetchOptions extends PrefetchRoutesOptions {
  enabled?: boolean;
}

/**
 * Moteur de prefetch intelligent — idle batch + hover ciblé.
 * Respecte `routePrefetchEnabled` (désactivé en Africa Mode).
 */
export function useSmartPrefetch(
  routes: readonly string[],
  options: UseSmartPrefetchOptions = {},
) {
  const router = useRouter();
  const { routePrefetchEnabled } = usePerformanceFlags();
  const enabled = (options.enabled ?? routePrefetchEnabled) && routes.length > 0;

  const stableRoutes = useMemo(() => [...new Set(routes.filter(Boolean))], [routes]);

  useEffect(() => {
    if (!enabled) return;
    prefetchRoutes(router, stableRoutes, {
      idle: options.idle,
      idleTimeoutMs: options.idleTimeoutMs,
    });
  }, [router, stableRoutes, enabled, options.idle, options.idleTimeoutMs]);

  const prefetchOnHover = useCallback(
    (href: string) => {
      if (!enabled) return;
      prefetchRoute(router, href);
    },
    [router, enabled],
  );

  const prefetchOne = useCallback(
    (href: string) => {
      if (!enabled) return;
      prefetchRoute(router, href);
    },
    [router, enabled],
  );

  return { prefetchOnHover, prefetchOne, enabled };
}
