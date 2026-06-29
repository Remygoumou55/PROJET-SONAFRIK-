import { createPublicCachedQuery } from "@/lib/cache";
import { fetchLandingStats } from "./fetchLandingStats";

/** Stats landing — cache 60s, partagé entre API route et SSR. */
export const getCachedLandingStats = createPublicCachedQuery(
  "landing-public-stats-v2",
  fetchLandingStats,
  { revalidate: 60, tags: ["landing-stats"] },
);
