"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, isLocalAuditMode } from "@/lib/supabase/client";

/** Tables qui impactent KPIs, badges sidebar ou activité admin. */
export const ADMIN_REALTIME_TABLES = [
  "profiles",
  "artist_profiles",
  "creators",
  "stream_sessions",
  "wallet_ledger",
  "albums",
  "tracks",
  "withdrawals",
  "rights_claims",
  "creator_verifications",
  "audit_logs",
] as const;

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

/**
 * Rafraîchit les RSC admin à chaque changement DB (< 1 s via Supabase Realtime).
 * Repli polling 60 s si Realtime indisponible (audit local, erreur channel).
 */
export function useAdminLiveRefresh() {
  const router = useRouter();
  const [liveTime, setLiveTime] = useState<string | null>(null);
  const [mode, setMode] = useState<AdminLiveMode>("connecting");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    router.refresh();
    setLiveTime(formatLiveTime(new Date()));
  }, [router]);

  const scheduleRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      refresh();
    }, DEBOUNCE_MS);
  }, [refresh]);

  useEffect(() => {
    if (isLocalAuditMode()) {
      setMode("polling");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const channelName = `admin_live_${Date.now()}`;

    let channel = supabase.channel(channelName);
    for (const table of ADMIN_REALTIME_TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh,
      );
    }

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setMode("realtime");
        refresh();
      } else if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        setMode("polling");
      }
    });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [refresh, scheduleRefresh]);

  useEffect(() => {
    if (mode !== "polling") return;
    refresh();
    const id = window.setInterval(refresh, FALLBACK_POLL_MS);
    return () => window.clearInterval(id);
  }, [mode, refresh]);

  return { liveTime, mode };
}
