"use client";

import { useEffect, useState } from "react";

/**
 * Active après First Contentful Paint — hydratation progressive shell auditeur.
 * Fallback requestIdleCallback + timeout pour environnements sans PerformanceObserver paint.
 */
export function useAfterFCP(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    let settled = false;
    const activate = () => {
      if (settled) return;
      settled = true;
      setReady(true);
    };

    const existing = performance.getEntriesByName("first-contentful-paint");
    if (existing.length > 0) {
      activate();
      return;
    }

    let observer: PerformanceObserver | undefined;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            activate();
            observer?.disconnect();
            break;
          }
        }
      });
      observer.observe({ type: "paint", buffered: true });
    } catch {
      observer = undefined;
    }

    const idleId =
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback(activate, { timeout: 2_000 })
        : undefined;
    const timeoutId = window.setTimeout(activate, 2_500);

    return () => {
      observer?.disconnect();
      if (idleId !== undefined) cancelIdleCallback(idleId);
      window.clearTimeout(timeoutId);
    };
  }, [ready]);

  return ready;
}
