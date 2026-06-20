"use client";

import { createContext, useContext } from "react";
import type { AudioQualityPreference } from "@sonafrik/types";

const QualityPreferenceContext = createContext<AudioQualityPreference>("auto");

export function QualityPreferenceProvider({
  value,
  children,
}: {
  value: AudioQualityPreference;
  children: React.ReactNode;
}) {
  return (
    <QualityPreferenceContext.Provider value={value}>
      {children}
    </QualityPreferenceContext.Provider>
  );
}

export function useQualityPreference(): AudioQualityPreference {
  return useContext(QualityPreferenceContext);
}
