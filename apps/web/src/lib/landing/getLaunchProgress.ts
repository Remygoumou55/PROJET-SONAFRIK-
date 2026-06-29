import { createPublicCachedQuery } from "@/lib/cache";
import type { LaunchProgress } from "@sonafrik/types";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import { parseLaunchProgress } from "./parseLaunchProgress";

async function fetchLaunchProgress(): Promise<LaunchProgress | null> {
  try {
    const supabase = getSupabasePublicClient();
    const { data, error } = await supabase.rpc("get_launch_progress");
    if (error || !data) return null;
    return parseLaunchProgress(data);
  } catch {
    return null;
  }
}

export const getLaunchProgress = createPublicCachedQuery(
  "landing-launch-progress",
  fetchLaunchProgress,
  { revalidate: 300, tags: ["subscriber-count", "launch-progress"] },
);
