"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type {
  AudioQualityKbps,
  PlayerState,
  StreamingPlatform,
  TrackWithMeta,
} from "@sonafrik/types";
import { REAL_LISTEN_THRESHOLD_PERCENT, STREAM_HEARTBEAT_INTERVAL_MS } from "@sonafrik/types";

interface PlayerActions {
  play: (track: TrackWithMeta, signedUrl: string, sessionId: string, duration: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  seek: (positionSeconds: number) => void;
  getAccumulatedListenSeconds: () => number;
  onHeartbeat: (callback: (positionSeconds: number) => void) => void;
  onComplete: (callback: () => void) => void;
}

interface PlayerContextValue extends PlayerState, PlayerActions {}

const initialState: PlayerState = {
  currentTrack: null,
  sessionId: null,
  signedUrl: null,
  isPlaying: false,
  isLoading: false,
  currentPosition: 0,
  duration: 0,
  volume: 1,
  platform: "web" as StreamingPlatform,
  quality: 128 as AudioQualityKbps,
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlayerState>(initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onHeartbeatCallbackRef = useRef<((pos: number) => void) | null>(null);
  const onCompleteCallbackRef = useRef<(() => void) | null>(null);
  // Secondes réellement écoutées en lecture continue — jamais incrémenté par seek()
  const accumulatedListenSecondsRef = useRef<number>(0);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Démarre le heartbeat 10s — remplace l'interval précédent s'il existe (C-2.3)
  // Envoie accumulatedListenSeconds (temps réel écouté) et non la position courante
  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        accumulatedListenSecondsRef.current += STREAM_HEARTBEAT_INTERVAL_MS / 1000;
        onHeartbeatCallbackRef.current?.(accumulatedListenSecondsRef.current);
      }
    }, STREAM_HEARTBEAT_INTERVAL_MS);
  }, [clearHeartbeat]);

  const play = useCallback(
    (track: TrackWithMeta, signedUrl: string, sessionId: string, duration: number) => {
      clearHeartbeat();
      accumulatedListenSecondsRef.current = 0;

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;
      audio.src = signedUrl;
      audio.volume = state.volume;
      audio.load();

      setState((prev) => ({
        ...prev,
        currentTrack: track,
        sessionId,
        signedUrl,
        isPlaying: true,
        isLoading: true,
        currentPosition: 0,
        duration,
      }));

      audio.play().catch((err: unknown) => {
        console.error("[Player] Lecture audio échouée", err);
        setState((prev) => ({ ...prev, isPlaying: false, isLoading: false }));
      });

      // Durée réelle depuis les métadonnées HTML5 — fallback si duration_seconds = 0 en DB
      audio.onloadedmetadata = () => {
        if (audio.duration > 0 && isFinite(audio.duration)) {
          setState((prev) => ({ ...prev, duration: audio.duration }));
        }
      };

      audio.oncanplay = () => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          duration: (audio.duration > 0 && isFinite(audio.duration)) ? audio.duration : prev.duration,
        }));
      };

      audio.ontimeupdate = () => {
        setState((prev) => ({ ...prev, currentPosition: audio.currentTime }));
      };

      audio.onended = () => {
        clearHeartbeat();
        setState((prev) => ({ ...prev, isPlaying: false, currentPosition: prev.duration }));
        onCompleteCallbackRef.current?.();
      };

      startHeartbeat();
    },
    [state.volume, clearHeartbeat, startHeartbeat],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    clearHeartbeat();
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, [clearHeartbeat]);

  const resume = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.play().catch((err: unknown) => { console.error("[Player] Reprise audio échouée", err); });
    setState((prev) => ({ ...prev, isPlaying: true }));
    startHeartbeat();
  }, [startHeartbeat]);

  const stop = useCallback(() => {
    clearHeartbeat();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setState(initialState);
  }, [clearHeartbeat]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (audioRef.current) audioRef.current.volume = clampedVolume;
    setState((prev) => ({ ...prev, volume: clampedVolume }));
  }, []);

  // Déplace la tête de lecture — bornes clampées [0, duration]
  const seek = useCallback((positionSeconds: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(positionSeconds, audioRef.current.duration || 0));
    audioRef.current.currentTime = clamped;
    setState((prev) => ({ ...prev, currentPosition: clamped }));
  }, []);

  const getAccumulatedListenSeconds = useCallback(() => {
    return accumulatedListenSecondsRef.current;
  }, []);

  const onHeartbeat = useCallback((cb: (pos: number) => void) => {
    onHeartbeatCallbackRef.current = cb;
  }, []);

  const onComplete = useCallback((cb: () => void) => {
    onCompleteCallbackRef.current = cb;
  }, []);

  useEffect(() => {
    return () => {
      clearHeartbeat();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [clearHeartbeat]);

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        play,
        pause,
        resume,
        stop,
        setVolume,
        seek,
        getAccumulatedListenSeconds,
        onHeartbeat,
        onComplete,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayerContext must be inside PlayerProvider");
  return ctx;
}

export { REAL_LISTEN_THRESHOLD_PERCENT };
