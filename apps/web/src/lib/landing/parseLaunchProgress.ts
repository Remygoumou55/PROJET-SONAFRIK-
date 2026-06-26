import type { LaunchProgress } from "@sonafrik/types";
import { SUBSCRIBER_TARGET } from "./constants";

/** Parse RPC get_launch_progress — retourne null si données absentes ou invalides. */
export function parseLaunchProgress(data: unknown): LaunchProgress | null {
  if (!data || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;
  const current = Number(raw.current ?? raw.subscribers ?? raw.count ?? raw.total ?? 0);
  const target = Number(raw.target ?? raw.goal ?? SUBSCRIBER_TARGET);
  const artistCount = Number(raw.artist_count ?? raw.artistCount ?? 0);
  const trackCount = Number(raw.track_count ?? raw.trackCount ?? 0);

  if (!Number.isFinite(current) || !Number.isFinite(target) || target < 1) return null;

  const percent = Math.min((current / target) * 100, 100);
  return {
    current,
    target,
    percent,
    launched: current >= target,
    artistCount: Number.isFinite(artistCount) ? artistCount : 0,
    trackCount: Number.isFinite(trackCount) ? trackCount : 0,
  };
}
