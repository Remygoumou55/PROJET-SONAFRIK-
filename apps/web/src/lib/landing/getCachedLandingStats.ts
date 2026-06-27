import { unstable_cache } from "next/cache";
import { fetchLandingStats } from "./fetchLandingStats";

/** Stats landing — cache 60s, partagé entre API route et SSR. */
export const getCachedLandingStats = unstable_cache(
  fetchLandingStats,
  ["landing-public-stats-v2"],
  { revalidate: 60, tags: ["landing-stats"] },
);
