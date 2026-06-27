"use client";

import dynamic from "next/dynamic";
import { useListenFeatures } from "../lib/listenFeaturesContext";

const DiscoverModeButton = dynamic(
  () => import("./DiscoverModeButton").then((m) => ({ default: m.DiscoverModeButton })),
  { ssr: false },
);

export function ListenDiscoverModeSlot() {
  const { discoverMode } = useListenFeatures();
  if (!discoverMode) return null;
  return (
    <div className="px-6 mt-6">
      <DiscoverModeButton />
    </div>
  );
}
