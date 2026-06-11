"use client";

import { useCallback, useEffect } from "react";
import type { TrackWithMeta } from "@sonafrik/types";
import { usePlayerContext } from "../lib/playerContext";
import { useStreamingService } from "./useStreaming";

export function usePlayer() {
  const player = usePlayerContext();
  const streaming = useStreamingService();

  useEffect(() => {
    player.onHeartbeat(async (positionSeconds) => {
      if (!player.sessionId) return;
      try {
        await streaming.sendHeartbeat({ sessionId: player.sessionId, positionSeconds });
      } catch {
        // heartbeat silencieux
      }
    });

    player.onComplete(async () => {
      if (!player.sessionId || !player.duration) return;
      try {
        await streaming.completeStream({
          sessionId: player.sessionId,
          positionSeconds: player.duration,
          totalDurationSeconds: player.duration,
        });
      } catch {
        // completion silencieuse
      }
    });
  }, [player, streaming]);

  const loadAndPlay = useCallback(
    async (track: TrackWithMeta): Promise<void> => {
      const result = await streaming.startStream({
        trackId: track.id,
        platform: "web",
      });
      player.play(track, result.signedUrl, result.sessionId, result.durationSeconds);
    },
    [streaming, player],
  );

  const pauseAndSave = useCallback(async () => {
    player.pause();
    if (player.currentTrack?.id && player.currentPosition > 0) {
      await streaming.savePosition({
        trackId: player.currentTrack.id,
        positionSeconds: Math.floor(player.currentPosition),
      }).catch(() => {});
    }
  }, [player, streaming]);

  return {
    ...player,
    loadAndPlay,
    pauseAndSave,
  };
}
