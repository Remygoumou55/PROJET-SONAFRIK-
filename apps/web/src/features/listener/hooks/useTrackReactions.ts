"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ReactionCount {
  emoji: string;
  count: number;
}

const REACTION_EMOJIS = ["❤️", "🔥", "😢", "🕺", "😮"] as const;

function emptyReactions(): ReactionCount[] {
  return REACTION_EMOJIS.map((emoji) => ({ emoji, count: 0 }));
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

    const loadInitialReactions = async () => {
      const { data } = await supabase
        .from("track_reaction_counts")
        .select("emoji, count")
        .eq("track_id", trackId);

      if (data?.length) {
        setReactions((prev) =>
          prev.map((reaction) => {
            const found = data.find((row) => row.emoji === reaction.emoji);
            return found ? { ...reaction, count: found.count ?? 0 } : reaction;
          }),
        );
      } else {
        setReactions(emptyReactions());
      }
    };

    const loadLiveListeners = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("stream_sessions")
        .select("id", { count: "exact", head: true })
        .eq("track_id", trackId)
        .gte("last_heartbeat_at", fiveMinutesAgo)
        .is("completed_at", null);

      setLiveListeners(count ?? 0);
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
