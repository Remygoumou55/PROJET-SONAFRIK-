"use client";

import { useListenFeatures } from "../lib/listenFeaturesContext";
import { DiscoverModeButton } from "./DiscoverModeButton";

export function ListenDiscoverModeSlot() {
  const { discoverMode } = useListenFeatures();
  if (!discoverMode) return null;
  return (
    <div className="px-6 mt-6">
      <DiscoverModeButton />
    </div>
  );
}
