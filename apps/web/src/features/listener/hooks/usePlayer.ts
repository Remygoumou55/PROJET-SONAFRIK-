"use client";

import { useCallback, useEffect, useRef } from "react";
import type { TrackWithMeta } from "@sonafrik/types";
import { usePlayerContext } from "../lib/playerContext";
import { useStreamingService } from "./useStreaming";
import { useStreamQuality } from "./useStreamQuality";

export function usePlayer() {
  const player = usePlayerContext();
  const streaming = useStreamingService();
  const { bitrate } = useStreamQuality();
  // Limite à 1 tentative de rechargement par erreur pour éviter les boucles infinies
  const retryAttemptRef = useRef(false);

  useEffect(() => {
    player.onHeartbeat(async (positionSeconds) => {
      if (!player.sessionId) return;
      try {
        await streaming.sendHeartbeat({ sessionId: player.sessionId, positionSeconds });
      } catch (err) {
        console.error("[Player] Heartbeat échoué", err);
      }
    });

    player.onComplete(async ({ sessionId, positionSeconds, totalDurationSeconds }) => {
      retryAttemptRef.current = false;
      try {
        await streaming.completeStream({
          sessionId,
          positionSeconds,
          totalDurationSeconds,
        });
      } catch (err) {
        console.warn("[Player] Complétion de session ignorée", err);
      }

      // Auto-avancement vers le morceau suivant dans la queue
      const nextTrack = player.advanceQueue();
      if (nextTrack) {
        try {
          const result = await streaming.startStream({ trackId: nextTrack.id, platform: "web", qualityKbps: bitrate });
          player.play(nextTrack, result.signedUrl, result.sessionId, result.durationSeconds);
        } catch (err) {
          console.error("[Player] Auto-avancement queue échoué", err);
        }
      }
    });

    // Récupération automatique sur URL expirée (une seule tentative par erreur)
    player.onError(async (errorType, positionSeconds) => {
      if (errorType === "codec") {
        // Codec incompatible — pas de retry possible
        retryAttemptRef.current = false;
        return;
      }
      if (retryAttemptRef.current || !player.currentTrack) {
        // Déjà tenté, ou pas de track — on abandonne
        retryAttemptRef.current = false;
        return;
      }
      retryAttemptRef.current = true;
      const trackToRetry = player.currentTrack;
      const savedPosition = positionSeconds;
      try {
        const result = await streaming.startStream({ trackId: trackToRetry.id, platform: "web", qualityKbps: bitrate });
        player.play(trackToRetry, result.signedUrl, result.sessionId, result.durationSeconds);
        // Reprendre à la position sauvegardée après chargement (~1s)
        if (savedPosition > 1) {
          setTimeout(() => { player.seek(savedPosition); }, 1000);
        }
        retryAttemptRef.current = false;
      } catch (err) {
        console.error("[Player] Rechargement URL échoué", err);
        retryAttemptRef.current = false;
      }
    });
  }, [player, streaming, bitrate]);

  const loadAndPlay = useCallback(
    async (track: TrackWithMeta): Promise<void> => {
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
        // Dev BYPASS : provisionner une session JWT si stream-start échoue (401)
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
    [streaming, player, bitrate],
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
    if (!prev) return;
    // retreatQueue retourne la piste courante quand > 3s sont écoulées (restart)
    // → seek(0) sans créer de nouvelle session (évite le double-comptage de streams)
    if (prev.id === player.currentTrack?.id) {
      player.restartCurrentTrack();
      return;
    }
    try {
      const result = await streaming.startStream({ trackId: prev.id, platform: "web" });
      player.play(prev, result.signedUrl, result.sessionId, result.durationSeconds);
    } catch (err) {
      console.error("[Player] Morceau précédent échoué", err);
    }
  }, [player, streaming]);

  const pauseAndSave = useCallback(async () => {
    player.pause();
    const pos = player.getPosition();
    if (player.currentTrack?.id && pos > 0) {
      await streaming.savePosition({
        trackId: player.currentTrack.id,
        positionSeconds: Math.floor(pos),
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
