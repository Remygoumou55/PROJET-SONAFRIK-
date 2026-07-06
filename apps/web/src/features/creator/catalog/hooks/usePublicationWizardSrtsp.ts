"use client";

import { useMemo } from "react";
import { createPublicationWizardPublisher } from "@sonafrik/realtime/adapters";
import { useSrtsp } from "@sonafrik/realtime/react";

/** Hook Publication Wizard → SRTSP Event Bus (Phase 3.1). */
export function usePublicationWizardSrtsp() {
  const { publish } = useSrtsp();
  return useMemo(() => createPublicationWizardPublisher(publish), [publish]);
}
