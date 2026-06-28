"use client";

import { useCallback, useEffect, useRef } from "react";
import type { TrackWithMeta } from "@sonafrik/types";
import type { StreamCompletePayload } from "../lib/playerTypes";
import { usePlayerContext } from "../lib/playerContext";
import { useStreamingPlaybackBridge } from "../integration/useStreamingPlaybackBridge";
import { useStreamQuality } from "./useStreamQuality";
import { useListenPageRefresh } from "./useListenPageRefresh";

export function usePlayer() {
  const player = usePlayerContext();
  const { bridge: streaming } = useStreamingPlaybackBridge();
  const { bitrate } = useStreamQuality();
  const refreshAfterValidListen = useListenPageRefresh();
  const retryAttemptRef = useRef(false);
  const completingRef = useRef(false);

  const finalizeSession = useCallback(
    async (payload: StreamCompletePayload | null, trackId: string | null): Promise<boolean> => {
      if (!payload || completingRef.current) return false;

      completingRef.current = true;
      try {
        const isValid = await streaming.completeStream(payload);
        if (isValid && trackId) {
          await refreshAfterValidListen(trackId);
        }
        return isValid;
      } catch (err) {
        console.warn("[Player] Complétion session échouée", err);
        return false;
      } finally {
        completingRef.current = false;
      }
    },
    [streaming, refreshAfterValidListen],
  );

  const completeActiveSession = useCallback(async (): Promise<boolean> => {
    const trackId = player.currentTrack?.id ?? null;
    const payload = player.takeCompletePayload("manual");
    return finalizeSession(payload, trackId);
  }, [player, finalizeSession]);

  const completeActiveSessionRef = useRef(completeActiveSession);
  completeActiveSessionRef.current = completeActiveSession;

  useEffect(() => {
    player.onHeartbeat(async (positionSeconds) => {
      if (!player.sessionId) return;
      const playhead = player.getPosition();
      const effectivePosition = Math.max(positionSeconds, playhead);
      try {
        await streaming.sendHeartbeat({
          sessionId: player.sessionId,
          positionSeconds: Math.floor(effectivePosition),
        });
      } catch (err) {
        console.error("[Player] Heartbeat échoué", err);
      }
    });

    player.onComplete(async (payload: StreamCompletePayload) => {
      retryAttemptRef.current = false;
      const trackId = player.currentTrack?.id ?? null;
      await finalizeSession(payload, trackId);

      if (!payload.advanceQueue) return;

      const nextTrack = player.advanceQueue();
      if (!nextTrack) return;

      try {
        const result = await streaming.startStream({
          trackId: nextTrack.id,
          platform: "web",
          qualityKbps: bitrate,
        });
        player.play(nextTrack, result.signedUrl, result.sessionId, result.durationSeconds);
      } catch (err) {
        console.error("[Player] Auto-avancement queue échoué", err);
      }
    });

    player.onError(async (errorType, positionSeconds) => {
      if (errorType === "codec") {
        retryAttemptRef.current = false;
        return;
      }
      if (retryAttemptRef.current || !player.currentTrack) {
        retryAttemptRef.current = false;
        return;
      }
      retryAttemptRef.current = true;
      const trackToRetry = player.currentTrack;
      const savedPosition = positionSeconds;
      try {
        await completeActiveSessionRef.current();
        const result = await streaming.startStream({
          trackId: trackToRetry.id,
          platform: "web",
          qualityKbps: bitrate,
        });
        player.play(trackToRetry, result.signedUrl, result.sessionId, result.durationSeconds);
        if (savedPosition > 1) {
          setTimeout(() => {
            player.seek(savedPosition);
          }, 1000);
        }
        retryAttemptRef.current = false;
      } catch (err) {
        console.error("[Player] Rechargement URL échoué", err);
        retryAttemptRef.current = false;
      }
    });
  }, [player, streaming, bitrate, finalizeSession]);

  useEffect(() => {
    const flushSession = () => {
      void completeActiveSessionRef.current();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushSession();
      }
    };

    window.addEventListener("pagehide", flushSession);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushSession);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      flushSession();
    };
  }, []);

  const loadAndPlay = useCallback(
    async (track: TrackWithMeta): Promise<void> => {
      await completeActiveSession();

      const start = async () => {
        const result = await streaming.startStream({
          trackId: track.id,
          platform: "web",
          qualityKbps: bitrate,
        });
        player.play(track, result.signedUrl, result.sessionId, result.durationSeconds, true);
      };

      try {
        await start();
      } catch (firstErr) {
        if (
          process.env.NODE_ENV === "development" &&
          process.env.NEXT_PUBLIC_BYPASS_AUTH === "true"
        ) {
          await fetch("/api/e2e/session", { method: "POST" }).catch(() => {});
          await start();
          return;
        }
        throw new Error(firstErr instanceof Error ? firstErr.message : "Impossible de démarrer la lecture.");
      }
    },
    [streaming, player, bitrate, completeActiveSession],
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
    await completeActiveSession();
    const next = player.advanceQueue();
    if (!next) return;
    try {
      const result = await streaming.startStream({ trackId: next.id, platform: "web", qualityKbps: bitrate });
      player.play(next, result.signedUrl, result.sessionId, result.durationSeconds);
    } catch (err) {
      console.error("[Player] Morceau suivant échoué", err);
    }
  }, [player, streaming, bitrate, completeActiveSession]);

  const playPrev = useCallback(async (): Promise<void> => {
    const prev = player.retreatQueue();
    if (!prev) return;
    if (prev.id === player.currentTrack?.id) {
      player.restartCurrentTrack();
      return;
    }
    await completeActiveSession();
    try {
      const result = await streaming.startStream({ trackId: prev.id, platform: "web", qualityKbps: bitrate });
      player.play(prev, result.signedUrl, result.sessionId, result.durationSeconds);
    } catch (err) {
      console.error("[Player] Morceau précédent échoué", err);
    }
  }, [player, streaming, bitrate, completeActiveSession]);

  const pauseAndSave = useCallback(async () => {
    player.pause();
    const pos = player.getPosition();
    if (player.currentTrack?.id && pos > 0) {
      await streaming
        .savePosition({
          trackId: player.currentTrack.id,
          positionSeconds: Math.floor(pos),
        })
        .catch((err: unknown) => {
          console.error("[Player] Sauvegarde position échouée", err);
        });
    }
  }, [player, streaming]);

  return {
    ...player,
    loadAndPlay,
    loadQueueAndPlay,
    playNext,
    playPrev,
    pauseAndSave,
    completeActiveSession,
  };
}
