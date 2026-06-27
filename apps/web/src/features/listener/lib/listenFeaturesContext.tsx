"use client";

import { createContext, useContext } from "react";
import {
  DEFAULT_LISTEN_FEATURE_FLAGS,
  type ListenFeatureFlags,
} from "@/lib/listen/listen-feature-flags";

const ListenFeaturesContext = createContext<ListenFeatureFlags>(DEFAULT_LISTEN_FEATURE_FLAGS);

export function ListenFeaturesProvider({
  flags,
  children,
}: {
  flags: ListenFeatureFlags;
  children: React.ReactNode;
}) {
  return (
    <ListenFeaturesContext.Provider value={flags}>{children}</ListenFeaturesContext.Provider>
  );
}

export function useListenFeatures(): ListenFeatureFlags {
  return useContext(ListenFeaturesContext);
}
