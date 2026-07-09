"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  createSupabaseTransport,
  DEFAULT_SRTSP_SUPABASE_SUBSCRIPTIONS,
} from "@sonafrik/realtime";
import { SrtspProvider } from "@sonafrik/realtime/react";
import { getSupabaseBrowserClient, isLocalAuditMode } from "@/lib/supabase/client";
import { useLdseSrtspBridge } from "./ldse-bridge";

const DEFERRED_REALTIME_ROUTE = "/creator/catalog/tracks";

function LdseSrtspBridge({ enabled }: { enabled: boolean }) {
  useLdseSrtspBridge(enabled);
  return null;
}

/** Enveloppe SRTSP globale — moteur Real-Time SONAFRIK Phase 2.1 */
export function RootSrtspShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldDeferTransport = pathname === DEFERRED_REALTIME_ROUTE;
  const [connectTransport, setConnectTransport] = useState(() => !shouldDeferTransport);

  const transport = useMemo(() => {
    if (isLocalAuditMode()) return undefined;
    return createSupabaseTransport({
      client: getSupabaseBrowserClient(),
      subscriptions: DEFAULT_SRTSP_SUPABASE_SUBSCRIPTIONS,
    });
  }, []);

  useEffect(() => {
    if (!shouldDeferTransport) {
      setConnectTransport(true);
      return;
    }

    setConnectTransport(false);
    const schedule =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => setConnectTransport(true), { timeout: 1200 })
        : window.setTimeout(() => setConnectTransport(true), 800);

    return () => {
      if (typeof schedule === "number") {
        window.clearTimeout(schedule);
        return;
      }
      window.cancelIdleCallback(schedule);
    };
  }, [shouldDeferTransport]);

  return (
    <SrtspProvider
      transport={transport}
      connectTransport={Boolean(transport) && connectTransport}
      trackBrowserOnline
    >
      <LdseSrtspBridge enabled={connectTransport} />
      {children}
    </SrtspProvider>
  );
}
