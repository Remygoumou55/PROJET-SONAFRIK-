"use client";

import type { AudioQualityKbps } from "@sonafrik/types";
import { useNetworkAware } from "@/lib/networkAware";
import { useQualityPreference } from "@/lib/qualityPreferenceContext";
import type { QualityLevel } from "@/lib/networkAware";

export type { QualityLevel };

export interface StreamQuality {
  bitrate: AudioQualityKbps;
  qualityLevel: QualityLevel;
  isSlowNetwork: boolean;
  /** true si le mode économie de données est actif (niveau != standard) */
  isEconomyMode: boolean;
}

function qualityLevelToBitrate(level: QualityLevel): AudioQualityKbps {
  if (level === "ultra_economique") return 64;
  if (level === "economique") return 96;
  return 128;
}

/** Choisit la qualité audio selon la préférence utilisateur et/ou la connexion réseau.
 *  Priorité : préférence manuelle > détection automatique. */
export function useStreamQuality(): StreamQuality {
  const { isSlowNetwork, qualityLevel: networkLevel } = useNetworkAware();
  const userPref = useQualityPreference();

  let bitrate: AudioQualityKbps;
  let effectiveLevel: QualityLevel;

  if (userPref === "256") {
    // Toujours haute qualité — ignore le réseau
    bitrate = 128;
    effectiveLevel = "standard";
  } else if (userPref === "64") {
    // Toujours économiser — ignore le réseau
    bitrate = 64;
    effectiveLevel = "ultra_economique";
  } else if (userPref === "128") {
    // Standard fixe — ignore le réseau
    bitrate = 96;
    effectiveLevel = "economique";
  } else {
    // auto — détection réseau
    effectiveLevel = networkLevel;
    bitrate = qualityLevelToBitrate(networkLevel);
  }

  return {
    bitrate,
    qualityLevel: effectiveLevel,
    isSlowNetwork,
    isEconomyMode: effectiveLevel !== "standard",
  };
}
