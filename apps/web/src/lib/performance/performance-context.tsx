"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { DEFAULT_PERFORMANCE_FLAGS, type PerformanceFlags } from "./types";

const PerformanceContext = createContext<PerformanceFlags>(DEFAULT_PERFORMANCE_FLAGS);

export function PerformanceProvider({
  flags,
  children,
}: {
  flags: PerformanceFlags;
  children: ReactNode;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.perfCdc = flags.animationsCdcCompliant ? "true" : "false";
    root.dataset.perfAfrica = flags.africaMode ? "true" : "false";
    root.dataset.perfPrefetch = flags.routePrefetchEnabled ? "true" : "false";

    return () => {
      delete root.dataset.perfCdc;
      delete root.dataset.perfAfrica;
      delete root.dataset.perfPrefetch;
    };
  }, [flags.animationsCdcCompliant, flags.africaMode, flags.routePrefetchEnabled]);

  return (
    <PerformanceContext.Provider value={flags}>{children}</PerformanceContext.Provider>
  );
}

export function usePerformanceFlags(): PerformanceFlags {
  return useContext(PerformanceContext);
}
