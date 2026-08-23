import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { Audio, type AVPlaybackStatus } from "expo-av";
import { createStreamingService } from "@sonafrik/api/streaming";
import { buildStreamCompletePayload, type StreamCompleteMode } from "@sonafrik/shared/streaming";
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
  queue: TrackWithMeta[];
  history: TrackWithMeta[];
}

function streamingPlatform(): "ios" | "android" | "web" {
  return Platform.OS === "android" ? "android" : "ios";
}

export function usePlayer() {
  const streaming = useMemo(() => createStreamingService(getSupabaseMobileClient()), []);
  const soundRef = useRef<Audio.Sound | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const durationRef = useRef(0);
  const positionRef = useRef(0);
  const completingRef = useRef(false);

  const [state, setState] = useState<MobilePlayerState>({
    currentTrack: null,
    sessionId: null,
    isPlaying: false,
    isLoading: false,
    currentPosition: 0,
    duration: 0,
    queue: [],
    history: [],
  });

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const getPlaybackPosition = useCallback(async (): Promise<number> => {
    if (!soundRef.current) return positionRef.current;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        return Math.floor((status.positionMillis ?? 0) / 1000);
      }
    } catch {
      // silencieux
    }
    return positionRef.current;
  }, []);

  const completeActiveSession = useCallback(
    async (mode: StreamCompleteMode): Promise<boolean> => {
      const sid = sessionIdRef.current;
      const dur = durationRef.current;
      if (!sid || dur <= 0 || completingRef.current) return false;

      completingRef.current = true;
      try {
        const playhead = await getPlaybackPosition();
        positionRef.current = Math.max(positionRef.current, playhead);
        const payload = buildStreamCompletePayload({
          sessionId: sid,
          positionSeconds: playhead,
          accumulatedSeconds: positionRef.current,
          durationSeconds: dur,
          mode,
        });
        const isValid = await streaming.completeStream(payload);
        sessionIdRef.current = null;
        return isValid;
      } catch {
        return false;
      } finally {
        completingRef.current = false;
      }
    },
    [streaming, getPlaybackPosition],
  );

  const completeActiveSessionRef = useRef(completeActiveSession);
  completeActiveSessionRef.current = completeActiveSession;

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

  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatRef.current = setInterval(async () => {
      const sid = sessionIdRef.current;
      if (!sid || !soundRef.current) return;
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          const pos = Math.floor((status.positionMillis ?? 0) / 1000);
          positionRef.current = Math.max(positionRef.current, pos);
          await streaming.sendHeartbeat({ sessionId: sid, positionSeconds: pos });
        }
      } catch {
        // silencieux
      }
    }, STREAM_HEARTBEAT_INTERVAL_MS);
  }, [streaming, clearHeartbeat]);

  const loadAndPlay = useCallback(
    async (track: TrackWithMeta) => {
      await completeActiveSession("manual");
      await unloadSound();
      positionRef.current = 0;
      setState((prev) => ({ ...prev, isLoading: true, currentTrack: track }));

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });

        const result = await streaming.startStream({
          trackId: track.id,
          platform: streamingPlatform(),
        });

        sessionIdRef.current = result.sessionId;
        durationRef.current = result.durationSeconds;

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

        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;

          const positionSeconds = Math.floor((status.positionMillis ?? 0) / 1000);
          const durationSeconds = Math.floor(
            (status.durationMillis ?? durationRef.current * 1000) / 1000,
          );
          positionRef.current = Math.max(positionRef.current, positionSeconds);

          setState((prev) => ({
            ...prev,
            isPlaying: status.isPlaying,
            currentPosition: positionSeconds,
            duration: durationSeconds > 0 ? durationSeconds : prev.duration,
          }));

          if (status.didJustFinish) {
            clearHeartbeat();
            void completeActiveSessionRef.current("natural");
            if (stateRef.current.queue.length > 0) {
              void playNextRef.current();
            } else {
              setState((prev) => ({ ...prev, isPlaying: false, sessionId: null }));
            }
          }
        });

        startHeartbeat();
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }));
        await unloadSound();
      }
    },
    [streaming, unloadSound, completeActiveSession, startHeartbeat, clearHeartbeat],
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
      startHeartbeat();
    }
  }, [startHeartbeat]);

  const addToQueue = useCallback((track: TrackWithMeta) => {
    setState((prev) => ({ ...prev, queue: [...prev.queue, track] }));
  }, []);

  const clearQueue = useCallback(() => {
    setState((prev) => ({ ...prev, queue: [], history: [] }));
  }, []);

  const playNext = useCallback(async () => {
    setState((prev) => {
      if (prev.queue.length === 0) return prev;
      const [next, ...rest] = prev.queue;
      return {
        ...prev,
        queue: rest,
        history: prev.currentTrack ? [prev.currentTrack, ...prev.history] : prev.history,
      };
    });
    const next = stateRef.current.queue[0];
    if (next) await loadAndPlay(next);
  }, [loadAndPlay]);

  const playPrevious = useCallback(async () => {
    setState((prev) => {
      if (prev.history.length === 0) return prev;
      const [previous, ...rest] = prev.history;
      return {
        ...prev,
        history: rest,
        queue: prev.currentTrack ? [prev.currentTrack, ...prev.queue] : prev.queue,
      };
    });
    const previous = stateRef.current.history[0];
    if (previous) await loadAndPlay(previous);
  }, [loadAndPlay]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const playNextRef = useRef(playNext);
  playNextRef.current = playNext;

  const seek = useCallback(async (positionSeconds: number) => {
    if (!soundRef.current) return;
    try {
      const ms = positionSeconds * 1000;
      await soundRef.current.setPositionAsync(ms);
      positionRef.current = positionSeconds;
      setState((prev) => ({ ...prev, currentPosition: positionSeconds }));
    } catch {
      // silencieux
    }
  }, []);

  const stop = useCallback(async () => {
    const playhead = await getPlaybackPosition();
    positionRef.current = Math.max(positionRef.current, playhead);

    await completeActiveSession("manual");
    await unloadSound();
    durationRef.current = 0;
    positionRef.current = 0;

    setState((prev) => ({
      ...prev,
      currentTrack: null,
      sessionId: null,
      isPlaying: false,
      isLoading: false,
      currentPosition: 0,
      duration: 0,
    }));
  }, [unloadSound, streaming, completeActiveSession, getPlaybackPosition]);

  useEffect(() => {
    return () => {
      void completeActiveSessionRef.current("manual");
      clearHeartbeat();
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, [clearHeartbeat]);

  return { ...state, loadAndPlay, pause, resume, seek, stop, addToQueue, playNext, playPrevious, clearQueue };
}
