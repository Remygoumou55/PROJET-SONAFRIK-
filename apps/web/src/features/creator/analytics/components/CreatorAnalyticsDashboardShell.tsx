"use client";

import dynamic from "next/dynamic";
import type { CreatorAnalyticsData } from "@sonafrik/types";
import AnalyticsLoading from "@/app/(creator)/creator/analytics/loading";

const CreatorAnalyticsDashboard = dynamic(
  () =>
    import("./CreatorAnalyticsDashboard").then((m) => m.CreatorAnalyticsDashboard),
  { loading: () => <AnalyticsLoading />, ssr: false },
);

interface Props {
  data: CreatorAnalyticsData;
  creatorId: string;
}

/** Shell client-only â€” Ã©vite mismatch hydration SSR sur dashboard interactif. */
export function CreatorAnalyticsDashboardShell({ data, creatorId }: Props) {
  return <CreatorAnalyticsDashboard data={data} creatorId={creatorId} />;
}
