import type { AudioQualityKbps } from "@sonafrik/types";
import { useNetworkAware } from "@/lib/networkAware";
import { useQualityPreference } from "@/lib/qualityPreferenceContext";
import { usePerformanceFlags } from "@/lib/performance";
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
  const { africaMode } = usePerformanceFlags();

  let bitrate: AudioQualityKbps;
  let effectiveLevel: QualityLevel;

  if (userPref === "256") {
    bitrate = africaMode ? 96 : 128;
    effectiveLevel = africaMode ? "economique" : "standard";
  } else if (userPref === "64") {
    bitrate = 64;
    effectiveLevel = "ultra_economique";
  } else if (userPref === "128") {
    bitrate = 96;
    effectiveLevel = "economique";
  } else {
    effectiveLevel = networkLevel;
    bitrate = qualityLevelToBitrate(networkLevel);
  }

  if (africaMode && effectiveLevel === "standard") {
    effectiveLevel = "economique";
    bitrate = 96;
  }

  return {
    bitrate,
    qualityLevel: effectiveLevel,
    isSlowNetwork,
    isEconomyMode: effectiveLevel !== "standard",
  };
}
