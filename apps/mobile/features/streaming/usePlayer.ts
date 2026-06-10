import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Audio, type AVPlaybackStatus } from "expo-av";
import { createStreamingService } from "@sonafrik/api/streaming";
import { STREAM_HEARTBEAT_INTERVAL_MS } from "@sonafrik/types";
import type { TrackWithMeta } from "@sonafrik/types";
import { getSupabaseMobileClient } from "../../lib/supabase";

interface MobilePlayerState {
  currentTrack: TrackWithMeta | null;
  sessionId: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentPosition: number;
  duration: number;
}

export function usePlayer() {
  const streaming = useMemo(() => createStreamingService(getSupabaseMobileClient()), []);
  const soundRef = useRef<Audio.Sound | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const durationRef = useRef(0);

  const [state, setState] = useState<MobilePlayerState>({
    currentTrack: null,
    sessionId: null,
    isPlaying: false,
    isLoading: false,
    currentPosition: 0,
    duration: 0,
  });

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const unloadSound = useCallback(async () => {
    clearHeartbeat();
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // silencieux
      }
      soundRef.current = null;
    }
  }, [clearHeartbeat]);

  const loadAndPlay = useCallback(
    async (track: TrackWithMeta) => {
      await unloadSound();
      setState((prev) => ({ ...prev, isLoading: true, currentTrack: track }));

      try {
        // Configurer le mode audio (lecture en arrière-plan)
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });

        // Démarrer la session via Edge Function (URL pré-signée — CDC Règle #10)
        const result = await streaming.startStream({
          trackId: track.id,
          platform: "ios",
        });

        sessionIdRef.current = result.sessionId;
        durationRef.current = result.durationSeconds;

        // Charger et lire le son
        const { sound } = await Audio.Sound.createAsync(
          { uri: result.signedUrl },
          { shouldPlay: true },
        );
        soundRef.current = sound;

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isPlaying: true,
          sessionId: result.sessionId,
          duration: result.durationSeconds,
          currentPosition: 0,
        }));

        // Callback de statut de lecture
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;

          const positionSeconds = Math.floor((status.positionMillis ?? 0) / 1000);
          const durationSeconds = Math.floor((status.durationMillis ?? durationRef.current * 1000) / 1000);

          setState((prev) => ({
            ...prev,
            isPlaying: status.isPlaying,
            currentPosition: positionSeconds,
            duration: durationSeconds > 0 ? durationSeconds : prev.duration,
          }));

          // Écoute terminée naturellement
          if (status.didJustFinish) {
            clearHeartbeat();
            const sid = sessionIdRef.current;
            if (sid) {
              streaming.completeStream({
                sessionId: sid,
                positionSeconds: durationRef.current,
                totalDurationSeconds: durationRef.current,
              }).catch(() => {});
            }
            setState((prev) => ({ ...prev, isPlaying: false }));
          }
        });

        // Heartbeat toutes les 10s (Real Listen V7.2)
        heartbeatRef.current = setInterval(async () => {
          const sid = sessionIdRef.current;
          if (!sid || !soundRef.current) return;
          try {
            const status = await soundRef.current.getStatusAsync();
            if (status.isLoaded && status.isPlaying) {
              const pos = Math.floor((status.positionMillis ?? 0) / 1000);
              await streaming.sendHeartbeat({ sessionId: sid, positionSeconds: pos });
            }
          } catch {
            // silencieux
          }
        }, STREAM_HEARTBEAT_INTERVAL_MS);
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }));
        await unloadSound();
      }
    },
    [streaming, unloadSound, clearHeartbeat],
  );

  const pause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync().catch(() => {});
    }
    clearHeartbeat();
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, [clearHeartbeat]);

  const resume = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync().catch(() => {});
      setState((prev) => ({ ...prev, isPlaying: true }));
      // Relancer heartbeat
      heartbeatRef.current = setInterval(async () => {
        const sid = sessionIdRef.current;
        if (!sid || !soundRef.current) return;
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            const pos = Math.floor((status.positionMillis ?? 0) / 1000);
            await streaming.sendHeartbeat({ sessionId: sid, positionSeconds: pos });
          }
        } catch {
          // silencieux
        }
      }, STREAM_HEARTBEAT_INTERVAL_MS);
    }
  }, [streaming]);

  const stop = useCallback(async () => {
    const sid = sessionIdRef.current;
    const dur = durationRef.current;
    let pos = 0;

    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          pos = Math.floor((status.positionMillis ?? 0) / 1000);
        }
      } catch {
        // silencieux
      }
    }

    await unloadSound();
    sessionIdRef.current = null;
    durationRef.current = 0;

    if (sid && dur > 0) {
      await streaming.completeStream({
        sessionId: sid,
        positionSeconds: pos,
        totalDurationSeconds: dur,
      }).catch(() => {});
    }

    setState({
      currentTrack: null,
      sessionId: null,
      isPlaying: false,
      isLoading: false,
      currentPosition: 0,
      duration: 0,
    });
  }, [unloadSound, streaming]);

  useEffect(() => {
    return () => {
      clearHeartbeat();
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, [clearHeartbeat]);

  return { ...state, loadAndPlay, pause, resume, stop };
}
