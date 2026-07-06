"use client";

import { useMemo, type ReactNode } from "react";
import {
  createSupabaseTransport,
  DEFAULT_SRTSP_SUPABASE_SUBSCRIPTIONS,
} from "@sonafrik/realtime";
import { SrtspProvider } from "@sonafrik/realtime/react";
import { getSupabaseBrowserClient, isLocalAuditMode } from "@/lib/supabase/client";
import { useLdseSrtspBridge } from "./ldse-bridge";

function LdseSrtspBridge() {
  useLdseSrtspBridge(true);
  return null;
}

/** Enveloppe SRTSP globale — moteur Real-Time SONAFRIK Phase 2.1 */
export function RootSrtspShell({ children }: { children: ReactNode }) {
  const transport = useMemo(() => {
    if (isLocalAuditMode()) return undefined;
    return createSupabaseTransport({
      client: getSupabaseBrowserClient(),
      subscriptions: DEFAULT_SRTSP_SUPABASE_SUBSCRIPTIONS,
    });
  }, []);

  return (
    <SrtspProvider transport={transport} connectTransport={Boolean(transport)} trackBrowserOnline>
      <LdseSrtspBridge />
      {children}
    </SrtspProvider>
  );
}
