"use client";

import { useNetworkAware } from "@/lib/networkAware";

export interface StreamQuality {
  bitrate: 64 | 128;
  isSlowNetwork: boolean;
}

/** Choisit automatiquement la qualité audio selon la connexion réseau. */
export function useStreamQuality(): StreamQuality {
  const { isSlowNetwork } = useNetworkAware();
  return {
    bitrate:       isSlowNetwork ? 64 : 128,
    isSlowNetwork,
  };
}
