"use client";

import { useEffect, useState } from "react";

interface NetworkInfo {
  effectiveType: "slow-2g" | "2g" | "3g" | "4g" | string;
  downlink: number; // Mbps
  addEventListener?: (event: string, handler: () => void) => void;
  removeEventListener?: (event: string, handler: () => void) => void;
}

export type QualityLevel = "standard" | "economique" | "ultra_economique";

export interface NetworkAwareState {
  isSlowNetwork: boolean;
  effectiveType: string;
  qualityLevel: QualityLevel;
}

const SLOW_TYPES = new Set(["slow-2g", "2g", "3g"]);
const SLOW_DOWNLINK_MBPS = 1.5;

const ULTRA_TYPES = new Set(["slow-2g", "2g"]);

function computeQualityLevel(conn: NetworkInfo): QualityLevel {
  const { effectiveType, downlink } = conn;
  if (ULTRA_TYPES.has(effectiveType) || downlink < 0.5) return "ultra_economique";
  if (effectiveType === "3g" || (downlink >= 0.5 && downlink <= 2)) return "economique";
  return "standard";
}

function getConnection(): NetworkInfo | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as unknown as { connection?: NetworkInfo }).connection;
}

function getState(): NetworkAwareState {
  const conn = getConnection();
  if (!conn) return { isSlowNetwork: false, effectiveType: "unknown", qualityLevel: "standard" };
  const isSlowNetwork = SLOW_TYPES.has(conn.effectiveType) || conn.downlink < SLOW_DOWNLINK_MBPS;
  return {
    isSlowNetwork,
    effectiveType: conn.effectiveType ?? "unknown",
    qualityLevel: computeQualityLevel(conn),
  };
}

export function useNetworkAware(): NetworkAwareState {
  const [state, setState] = useState<NetworkAwareState>({
    isSlowNetwork: false,
    effectiveType: "unknown",
    qualityLevel: "standard",
  });

  useEffect(() => {
    setState(getState());
    const conn = getConnection();
    if (!conn?.addEventListener) return;
    const handler = () => setState(getState());
    conn.addEventListener("change", handler);
    return () => conn.removeEventListener?.("change", handler);
  }, []);

  return state;
}
