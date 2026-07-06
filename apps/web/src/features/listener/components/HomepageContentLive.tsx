"use client";

import { HomepageContentSections } from "./HomepageContentSections";
import type { HomepageData } from "./HomepageContentSections";
import { useListenHomeSrtspLive } from "../hooks/useListenHomeSrtspLive";

/** Accueil auditeur — SSR initialData + refresh SRTSP ciblé (Phase 3.8). */
export function HomepageContentLive({
  category,
  initialData,
}: {
  category: string;
  initialData: HomepageData;
}) {
  const { data: liveContent } = useListenHomeSrtspLive({
    category,
    initialData,
  });

  return <HomepageContentSections content={liveContent ?? initialData} />;
}
