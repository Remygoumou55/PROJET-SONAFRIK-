"use client";

import { useEffect, useState } from "react";

interface NetworkInfo {
  effectiveType: "slow-2g" | "2g" | "3g" | "4g" | string;
  downlink: number; // Mbps
}

export interface NetworkAwareState {
  isSlowNetwork: boolean;
  effectiveType: string;
}

const SLOW_TYPES = new Set(["slow-2g", "2g", "3g"]);
const SLOW_DOWNLINK_MBPS = 1.5;

function getState(): NetworkAwareState {
  if (typeof window === "undefined") return { isSlowNetwork: false, effectiveType: "unknown" };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection as NetworkInfo | undefined;
  if (!conn) return { isSlowNetwork: false, effectiveType: "unknown" };
  const isSlowNetwork = SLOW_TYPES.has(conn.effectiveType) || conn.downlink < SLOW_DOWNLINK_MBPS;
  return { isSlowNetwork, effectiveType: conn.effectiveType ?? "unknown" };
}

export function useNetworkAware(): NetworkAwareState {
  const [state, setState] = useState<NetworkAwareState>({ isSlowNetwork: false, effectiveType: "unknown" });

  useEffect(() => {
    setState(getState());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection;
    if (!conn) return;
    const handler = () => setState(getState());
    conn.addEventListener("change", handler);
    return () => conn.removeEventListener("change", handler);
  }, []);

  return state;
}
