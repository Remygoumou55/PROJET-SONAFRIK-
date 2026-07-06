"use client";

import { useCallback } from "react";
import { dispatchValidListen } from "../lib/validListenFeedback";

const HOME_INVALIDATE_EVENT = "sonafrik:listener-home-invalidate";

/** Rafraîchit l'accueil auditeur après une écoute validée — SRTSP ciblé (Phase 3.8). */
export function useListenPageRefresh() {
  return useCallback(async (trackId: string) => {
    dispatchValidListen(trackId);
    await fetch("/api/listener/revalidate-home", { method: "POST" }).catch(() => {});
    window.dispatchEvent(new CustomEvent(HOME_INVALIDATE_EVENT));
  }, []);
}

export { HOME_INVALIDATE_EVENT };
