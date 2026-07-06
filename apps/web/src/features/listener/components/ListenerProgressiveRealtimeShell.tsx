"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import {
  createSupabaseTransport,
  DEFAULT_SRTSP_SUPABASE_SUBSCRIPTIONS,
} from "@sonafrik/realtime";
import { SrtspProvider, useSrtsp } from "@sonafrik/realtime/react";
import { getSupabaseBrowserClient, isLocalAuditMode } from "@/lib/supabase/client";
import { LdseDevPanel } from "@/features/shared/ldse/LdseDevPanel";
import { LdseProvider } from "@/features/shared/ldse/LdseProvider";
import { registerLdseDomainRules } from "@/features/shared/ldse/registerDomainRules";
import { useLdseSrtspBridge } from "@/features/shared/srtsp/ldse-bridge";

function ListenerRuntimeServices({ active }: { active: boolean }) {
  const { engine } = useSrtsp();
  useLdseSrtspBridge(active);

  useEffect(() => {
    if (!active) return;
    registerLdseDomainRules();
    void engine.connectTransport().catch(() => {
      /* journalisé par TransportManager */
    });
  }, [active, engine]);

  if (!active) return null;
  return <LdseDevPanel />;
}

/**
 * Layer 5 — SRTSP context immédiat (hooks page), connexion transport + LDSE lourd après FCP.
 * Évite remontage des enfants tout en préservant useSrtsp / useLiveQuery.
 */
export function ListenerProgressiveRealtimeShell({
  children,
  runtimeReady,
}: {
  children: ReactNode;
  runtimeReady: boolean;
}) {
  const transport = useMemo(() => {
    if (isLocalAuditMode()) return undefined;
    return createSupabaseTransport({
      client: getSupabaseBrowserClient(),
      subscriptions: DEFAULT_SRTSP_SUPABASE_SUBSCRIPTIONS,
    });
  }, []);

  return (
    <SrtspProvider transport={transport} connectTransport={false} trackBrowserOnline>
      <LdseProvider>
        <ListenerRuntimeServices active={runtimeReady} />
        {children}
      </LdseProvider>
    </SrtspProvider>
  );
}
