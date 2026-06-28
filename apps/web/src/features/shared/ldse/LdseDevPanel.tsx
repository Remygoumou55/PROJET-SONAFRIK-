"use client";

import { useEffect } from "react";
import { ldseObservability } from "./observability";

declare global {
  interface Window {
    __SONAFRIK_LDSE__?: () => ReturnType<typeof ldseObservability.snapshot>;
  }
}

/** Expose les métriques LDSE en dev via `window.__SONAFRIK_LDSE__()` */
export function LdseDevPanel() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    window.__SONAFRIK_LDSE__ = () => ldseObservability.snapshot();
    return () => {
      delete window.__SONAFRIK_LDSE__;
    };
  }, []);

  return null;
}
