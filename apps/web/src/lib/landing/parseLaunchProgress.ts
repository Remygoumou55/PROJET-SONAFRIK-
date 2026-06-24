import type { LaunchProgress } from "@sonafrik/types";
import { SUBSCRIBER_TARGET } from "./constants";

const FALLBACK: LaunchProgress = {
  current: 0,
  target: SUBSCRIBER_TARGET,
  percent: 0,
  launched: false,
};

/** Parse RPC get_launch_progress — tolère les clés JSON variables. */
export function parseLaunchProgress(data: unknown): LaunchProgress {
  if (!data || typeof data !== "object") return FALLBACK;

  const raw = data as Record<string, unknown>;
  const current = Number(raw.current ?? raw.subscribers ?? raw.count ?? raw.total ?? 0);
  const target = SUBSCRIBER_TARGET;

  if (!Number.isFinite(current) || !Number.isFinite(target)) return FALLBACK;

  const percent = Math.min((current / target) * 100, 100);
  return {
    current,
    target,
    percent,
    launched: current >= target,
  };
}
