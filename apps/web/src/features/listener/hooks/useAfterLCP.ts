"use client";

import { useEffect, useState } from "react";

/**
 * Active après Largest Contentful Paint — diffère prefetch non critique (ex. /wallet).
 * Fallback idle + timeout pour environnements sans PerformanceObserver LCP.
 */
export function useAfterLCP(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    let settled = false;
    const activate = () => {
      if (settled) return;
      settled = true;
      setReady(true);
    };

    const existing = performance.getEntriesByType("largest-contentful-paint");
    if (existing.length > 0) {
      activate();
      return;
    }

    let observer: PerformanceObserver | undefined;
    try {
      observer = new PerformanceObserver(() => {
        activate();
        observer?.disconnect();
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      observer = undefined;
    }

    const idleId =
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback(activate, { timeout: 4_000 })
        : undefined;
    const timeoutId = window.setTimeout(activate, 4_500);

    return () => {
      observer?.disconnect();
      if (idleId !== undefined) cancelIdleCallback(idleId);
      window.clearTimeout(timeoutId);
    };
  }, [ready]);

  return ready;
}
