"use client";

import { useState } from "react";
import { createListenerService } from "@sonafrik/api/listener";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { usePlayerContext } from "../lib/playerContext";
import { useTrackReactions } from "../hooks/useTrackReactions";

export function LiveReactions() {
  const { currentTrack } = usePlayerContext();
  const trackId = currentTrack?.id ?? null;
  const { reactions, liveListeners } = useTrackReactions(trackId);
  const [recentlyReacted, setRecentlyReacted] = useState<string | null>(null);

  if (!currentTrack) return null;

  const handleReact = async (emoji: string) => {
    if (recentlyReacted === emoji) return;

    setRecentlyReacted(emoji);
    setTimeout(() => setRecentlyReacted(null), 2000);

    const listener = createListenerService(getSupabaseBrowserClient());
    await listener.addTrackReaction(currentTrack.id, emoji).catch(() => undefined);
  };

  return (
    <div className="live-reactions">
      {liveListeners > 1 ? (
        <div className="live-listeners">
          <span className="live-dot" aria-hidden="true" />
          <span className="live-text">
            {liveListeners} personnes écoutent maintenant
          </span>
        </div>
      ) : null}

      <div className="reactions-row" role="group" aria-label="Réactions en direct">
        {reactions.map(({ emoji, count }) => (
          <button
            key={emoji}
            type="button"
            className={`reaction-btn${recentlyReacted === emoji ? " reacted" : ""}`}
            onClick={() => void handleReact(emoji)}
            aria-label={`Réaction ${emoji}${count > 0 ? ` (${count})` : ""}`}
          >
            <span className="reaction-emoji" aria-hidden="true">
              {emoji}
            </span>
            {count > 0 ? (
              <span className="reaction-count">
                {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
