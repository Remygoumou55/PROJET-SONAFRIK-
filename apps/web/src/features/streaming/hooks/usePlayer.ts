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
      } catch (err) {
        console.error("[Player] Heartbeat échoué", err);
      }
    });

    player.onComplete(async () => {
      // Finaliser la session courante
      if (player.sessionId && player.duration) {
        const accumulated = player.getAccumulatedListenSeconds();
        try {
          await streaming.completeStream({
            sessionId: player.sessionId,
            positionSeconds: accumulated,
            totalDurationSeconds: player.duration,
          });
        } catch (err) {
          console.error("[Player] Complétion de session échouée", err);
        }
      }

      // Auto-avancement vers le morceau suivant dans la queue
      const nextTrack = player.advanceQueue();
      if (nextTrack) {
        try {
          const result = await streaming.startStream({ trackId: nextTrack.id, platform: "web" });
          player.play(nextTrack, result.signedUrl, result.sessionId, result.durationSeconds);
        } catch (err) {
          console.error("[Player] Auto-avancement queue échoué", err);
        }
      }
    });
  }, [player, streaming]);

  const loadAndPlay = useCallback(
    async (track: TrackWithMeta): Promise<void> => {
      try {
        const result = await streaming.startStream({
          trackId: track.id,
          platform: "web",
        });
        player.play(track, result.signedUrl, result.sessionId, result.durationSeconds);
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Impossible de démarrer la lecture.");
      }
    },
    [streaming, player],
  );

  const loadQueueAndPlay = useCallback(
    async (tracks: TrackWithMeta[], startIndex = 0): Promise<void> => {
      const track = tracks[startIndex];
      if (!track) return;
      player.setQueue(tracks, startIndex);
      await loadAndPlay(track);
    },
    [player, loadAndPlay],
  );

  const playNext = useCallback(async (): Promise<void> => {
    const next = player.advanceQueue();
    if (next) {
      try {
        const result = await streaming.startStream({ trackId: next.id, platform: "web" });
        player.play(next, result.signedUrl, result.sessionId, result.durationSeconds);
      } catch (err) {
        console.error("[Player] Morceau suivant échoué", err);
      }
    }
  }, [player, streaming]);

  const playPrev = useCallback(async (): Promise<void> => {
    const prev = player.retreatQueue();
    if (prev) {
      try {
        const result = await streaming.startStream({ trackId: prev.id, platform: "web" });
        player.play(prev, result.signedUrl, result.sessionId, result.durationSeconds);
      } catch (err) {
        console.error("[Player] Morceau précédent échoué", err);
      }
    }
  }, [player, streaming]);

  const pauseAndSave = useCallback(async () => {
    player.pause();
    if (player.currentTrack?.id && player.currentPosition > 0) {
      await streaming.savePosition({
        trackId: player.currentTrack.id,
        positionSeconds: Math.floor(player.currentPosition),
      }).catch((err: unknown) => { console.error("[Player] Sauvegarde position échouée", err); });
    }
  }, [player, streaming]);

  return {
    ...player,
    loadAndPlay,
    loadQueueAndPlay,
    playNext,
    playPrev,
    pauseAndSave,
  };
}
