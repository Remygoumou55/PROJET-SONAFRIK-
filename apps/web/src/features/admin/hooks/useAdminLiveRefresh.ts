import { useCallback, useEffect, useRef, useState } from "react";
import { getAdminHubInvalidateEvents, shouldRefreshAdminHub } from "@sonafrik/realtime/adapters";
import { useEventSubscription, useSrtspOptional } from "@sonafrik/realtime/react";
import { isLocalAuditMode } from "@/lib/supabase/client";
import { ldseEventBus } from "@/features/shared/ldse/event-bus";
import { ADMIN_LDSE_EVENTS } from "@/features/shared/ldse/admin/admin-ldse-config";
import { useLdseEvent } from "@/features/shared/ldse/LdseProvider";

const DEBOUNCE_MS = 300;
const FALLBACK_POLL_MS = 60_000;

function formatLiveTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export type AdminLiveMode = "connecting" | "realtime" | "polling";

interface Options {
  /** Forcé côté serveur quand BYPASS_AUTH (pas de JWT navigateur pour Realtime). */
  disableRealtime?: boolean;
}

/**
 * Pont SRTSP hub → LDSE snapshot (sans channel Supabase direct).
 */
export function useAdminLiveRefresh(options?: Options) {
  const [liveTime, setLiveTime] = useState<string | null>(null);
  const [mode, setMode] = useState<AdminLiveMode>("connecting");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disableRealtime = options?.disableRealtime === true || isLocalAuditMode();
  const srtsp = useSrtspOptional();
  const invalidateEvents = getAdminHubInvalidateEvents();

  const publishSnapshotInvalidate = useCallback(() => {
    ldseEventBus.publish(ADMIN_LDSE_EVENTS.snapshotInvalidate);
    setLiveTime(formatLiveTime(new Date()));
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      publishSnapshotInvalidate();
    }, DEBOUNCE_MS);
  }, [publishSnapshotInvalidate]);

  useLdseEvent(ADMIN_LDSE_EVENTS.snapshotRefreshed, () => {
    setLiveTime(formatLiveTime(new Date()));
  });

  useEventSubscription(
    invalidateEvents,
    (event) => {
      if (!shouldRefreshAdminHub(event)) return;
      scheduleRefresh();
    },
    !disableRealtime,
  );

  useEffect(() => {
    if (disableRealtime) {
      setMode("polling");
      return;
    }
    if (srtsp?.connectionState === "online") {
      setMode("realtime");
      publishSnapshotInvalidate();
      return;
    }
    setMode("connecting");
    const id = window.setInterval(() => {
      if (srtsp?.connectionState === "online") {
        setMode("realtime");
        publishSnapshotInvalidate();
        window.clearInterval(id);
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [disableRealtime, publishSnapshotInvalidate, srtsp]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode !== "polling") return;
    const tick = () => {
      if (document.visibilityState === "visible") publishSnapshotInvalidate();
    };
    tick();
    const id = window.setInterval(tick, FALLBACK_POLL_MS);
    return () => window.clearInterval(id);
  }, [mode, publishSnapshotInvalidate]);

  return { liveTime, mode };
}
