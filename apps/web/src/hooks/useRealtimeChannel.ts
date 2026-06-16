"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PgEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export interface RealtimeListener {
  event: PgEvent;
  table: string;
  filter?: string;
  onEvent: () => void;
}

/**
 * Abonne un channel Supabase Realtime postgres_changes.
 *
 * Suffixe le nom du channel avec Date.now() à chaque montage pour éviter
 * l'erreur "cannot add callbacks after subscribe()" lors des re-montages
 * SPA (navigation Next.js) où l'ancien channel n'est pas encore désabonné.
 */
export function useRealtimeChannel(
  channelPrefix: string,
  listeners: RealtimeListener[],
  enabled = true,
) {
  const listenersRef = useRef(listeners);
  listenersRef.current = listeners;

  useEffect(() => {
    if (!enabled || !channelPrefix) return;

    const supabase = getSupabaseBrowserClient();
    const channelName = `${channelPrefix}_${Date.now()}`;

    let ch = supabase.channel(channelName);
    for (const { event, table, filter, onEvent } of listenersRef.current) {
      ch = ch.on(
        "postgres_changes" as "system",
        {
          event,
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        } as Parameters<ReturnType<typeof supabase.channel>["on"]>[1],
        onEvent,
      );
    }
    ch.subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [channelPrefix, enabled]);
}
