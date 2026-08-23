"use client";

import { useEffect, useRef } from "react";
import { HomepageContentSections } from "./HomepageContentSections";
import type { HomepageData } from "./HomepageContentSections";
import { useListenHomeSrtspLive } from "../hooks/useListenHomeSrtspLive";

/** Accueil auditeur — SSR initialData, mise à jour locale via SRTSP (pas de refresh route). */
export function HomepageContentLive({
  category,
  initialData,
}: {
  category: string;
  initialData: HomepageData;
}) {
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
  }, [liveContent, loading, category]);

  return <HomepageContentSections content={liveContent ?? initialData} />;
}
