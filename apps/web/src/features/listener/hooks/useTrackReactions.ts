"use client";

import { useEffect, useState } from "react";
import { createListenerService } from "@sonafrik/api/listener";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ReactionCount {
  emoji: string;
  count: number;
}

const REACTION_EMOJIS = ["❤️", "🔥", "😢", "🕺", "😮"] as const;

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

  useEffect(() => {
    if (!trackId) {
      setReactions(emptyReactions());
      setLiveListeners(0);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const listener = createListenerService(supabase);

    const loadInitialReactions = async () => {
      try {
        const rows = await listener.getTrackReactionCounts(trackId);
        setReactions(rows.length ? mergeReactionRows(rows) : emptyReactions());
      } catch {
        setReactions(emptyReactions());
      }
    };

    const loadLiveListeners = async () => {
      try {
        const count = await listener.getLiveListenerCount(trackId);
        setLiveListeners(count);
      } catch {
        setLiveListeners(0);
      }
    };

    void loadInitialReactions();
    void loadLiveListeners();

    const reactionsChannel = supabase
      .channel(`reactions:${trackId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "track_reaction_counts",
          filter: `track_id=eq.${trackId}`,
        },
        (payload) => {
          const row = payload.new as { emoji?: string; count?: number } | null;
          if (!row?.emoji) return;
          setReactions((prev) =>
            prev.map((reaction) =>
              reaction.emoji === row.emoji
                ? { ...reaction, count: row.count ?? reaction.count }
                : reaction,
            ),
          );
        },
      )
      .subscribe();

    const sessionsChannel = supabase
      .channel(`live-listeners:${trackId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stream_sessions",
          filter: `track_id=eq.${trackId}`,
        },
        () => {
          void loadLiveListeners();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(reactionsChannel);
      void supabase.removeChannel(sessionsChannel);
    };
  }, [trackId]);

  return { reactions, liveListeners };
}
