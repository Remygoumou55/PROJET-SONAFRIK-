"use client";

import type { ReactNode } from "react";
import { SrtspProvider } from "@sonafrik/realtime/react";
import { useLdseSrtspBridge } from "./ldse-bridge";

function LdseSrtspBridge() {
  useLdseSrtspBridge(true);
  return null;
}

/** Enveloppe SRTSP globale — moteur Real-Time SONAFRIK v1.0 */
export function RootSrtspShell({ children }: { children: ReactNode }) {
  return (
    <SrtspProvider trackBrowserOnline>
      <LdseSrtspBridge />
      {children}
    </SrtspProvider>
  );
}
