import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { LaunchProgress } from "@sonafrik/types";
import { parseLaunchProgress } from "./parseLaunchProgress";

async function fetchLaunchProgress(): Promise<LaunchProgress> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return parseLaunchProgress(null);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const supabase = createClient(url, key, {
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer)),
      },
    });
    const { data, error } = await supabase.rpc("get_launch_progress");
    if (error || !data) return parseLaunchProgress(null);
    return parseLaunchProgress(data);
  } catch {
    return parseLaunchProgress(null);
  }
}

export const getLaunchProgress = unstable_cache(
  fetchLaunchProgress,
  ["landing-launch-progress"],
  { revalidate: 300, tags: ["subscriber-count", "launch-progress"] },
);
