"use client";

import { useAfterLCP } from "../hooks/useAfterLCP";
import {
  MusicBottomNav,
  LISTENER_MOBILE_NAV_ITEMS,
  isListenerNavActive,
} from "@/features/shared/navigation";

const SHORT_LABELS: Record<string, string> = {
  "/library": "Biblio",
};

export function MobileBottomNav() {
  const lcpReady = useAfterLCP();

  return (
    <MusicBottomNav
      items={LISTENER_MOBILE_NAV_ITEMS}
      isActive={isListenerNavActive}
      deferWalletPrefetch={!lcpReady}
      shortLabels={SHORT_LABELS}
    />
  );
}
