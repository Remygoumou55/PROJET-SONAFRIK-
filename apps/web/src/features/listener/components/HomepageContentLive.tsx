"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { data: liveContent, loading } = useListenHomeSrtspLive({
    category,
    initialData,
  });
  const latestSerializedRef = useRef(JSON.stringify(initialData));

  useEffect(() => {
    if (loading || !liveContent) return;
    const serialized = JSON.stringify(liveContent);
    if (serialized === latestSerializedRef.current) return;
    latestSerializedRef.current = serialized;
    router.refresh();
  }, [liveContent, loading, router]);

  return <HomepageContentSections content={liveContent ?? initialData} />;
}
