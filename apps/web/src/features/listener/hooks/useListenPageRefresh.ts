"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { dispatchValidListen } from "../lib/validListenFeedback";

/** Rafraîchit les compteurs homepage après une écoute validée (Real Listen). */
export function useListenPageRefresh() {
  const router = useRouter();

  return useCallback(async (trackId: string) => {
    dispatchValidListen(trackId);
    await fetch("/api/listener/revalidate-home", { method: "POST" }).catch(() => {});
    router.refresh();
  }, [router]);
}
