import { useCallback, useEffect, useMemo, useState } from "react";
import { createListenerService } from "@sonafrik/api/listener";
import { SRTSP_DOMAIN_EVENTS } from "@sonafrik/realtime/events";
import { useEventSubscription } from "@sonafrik/realtime/react";
import { usePageVisible } from "@/hooks/usePageVisible";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ReactionCount {
  emoji: string;
  count: number;
}

const REACTION_EMOJIS = ["❤️", "🔥", "😢", "🕺", "😮"] as const;
const POLL_MS = 30_000;

const LIVE_EVENTS = [
  SRTSP_DOMAIN_EVENTS.TRACK_REACTION_UPDATED,
  SRTSP_DOMAIN_EVENTS.LISTENER_LIVE_UPDATED,
] as const;

function emptyReactions(): ReactionCount[] {
  return REACTION_EMOJIS.map((emoji) => ({ emoji, count: 0 }));
}

function mergeReactionRows(rows: { emoji: string; count: number }[]): ReactionCount[] {
  return emptyReactions().map((reaction) => {
    const found = rows.find((row) => row.emoji === reaction.emoji);
    return found ? { ...reaction, count: found.count } : reaction;
  });
}

export function useTrackReactions(trackId: string | null) {
  const [reactions, setReactions] = useState<ReactionCount[]>(emptyReactions);
  const [liveListeners, setLiveListeners] = useState(0);
  const pageVisible = usePageVisible();

  const listener = useMemo(() => createListenerService(getSupabaseBrowserClient()), []);

  const loadInitialReactions = useCallback(async () => {
    if (!trackId) return;
    try {
      const rows = await listener.getTrackReactionCounts(trackId);
      setReactions(rows.length ? mergeReactionRows(rows) : emptyReactions());
    } catch {
      setReactions(emptyReactions());
    }
  }, [listener, trackId]);

  const loadLiveListeners = useCallback(async () => {
    if (!trackId) return;
    try {
      const count = await listener.getLiveListenerCount(trackId);
      setLiveListeners(count);
    } catch {
      setLiveListeners(0);
    }
  }, [listener, trackId]);

  const refreshAll = useCallback(() => {
    void loadInitialReactions();
    void loadLiveListeners();
  }, [loadInitialReactions, loadLiveListeners]);

  useEffect(() => {
    if (!trackId) {
      setReactions(emptyReactions());
      setLiveListeners(0);
      return;
    }
    refreshAll();
    if (!pageVisible) return;
    const id = window.setInterval(refreshAll, POLL_MS);
    return () => window.clearInterval(id);
  }, [trackId, refreshAll, pageVisible]);

  useEventSubscription(
    [...LIVE_EVENTS],
    (event) => {
      const payloadTrackId = event.payload?.trackId;
      if (typeof payloadTrackId !== "string" || payloadTrackId !== trackId) return;

      if (event.name === SRTSP_DOMAIN_EVENTS.TRACK_REACTION_UPDATED) {
        const emoji = event.payload?.emoji;
        const count = event.payload?.count;
        if (typeof emoji !== "string") {
          void loadInitialReactions();
          return;
        }
        setReactions((prev) =>
          prev.map((reaction) =>
            reaction.emoji === emoji
              ? { ...reaction, count: typeof count === "number" ? count : reaction.count }
              : reaction,
          ),
        );
        return;
      }

      void loadLiveListeners();
    },
    Boolean(trackId),
  );

  return { reactions, liveListeners };
}
