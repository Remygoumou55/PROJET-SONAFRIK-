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

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const play = useCallback(
    (track: TrackWithMeta, signedUrl: string, sessionId: string, duration: number) => {
      clearHeartbeat();

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

      audio.play().catch(() => {
        setState((prev) => ({ ...prev, isPlaying: false, isLoading: false }));
      });

      audio.oncanplay = () => setState((prev) => ({ ...prev, isLoading: false }));

      audio.ontimeupdate = () => {
        setState((prev) => ({ ...prev, currentPosition: audio.currentTime }));
      };

      audio.onended = () => {
        clearHeartbeat();
        setState((prev) => ({ ...prev, isPlaying: false, currentPosition: prev.duration }));
        onCompleteCallbackRef.current?.();
      };

      // Heartbeat toutes les 10s (Real Listen V7.2)
      heartbeatRef.current = setInterval(() => {
        if (audio && !audio.paused) {
          onHeartbeatCallbackRef.current?.(audio.currentTime);
        }
      }, STREAM_HEARTBEAT_INTERVAL_MS);
    },
    [state.volume, clearHeartbeat],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    clearHeartbeat();
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, [clearHeartbeat]);

  const resume = useCallback(() => {
    if (!audioRef.current) return;
    clearHeartbeat();
    audioRef.current.play().catch(() => {});
    setState((prev) => ({ ...prev, isPlaying: true }));
    heartbeatRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        onHeartbeatCallbackRef.current?.(audio.currentTime);
      }
    }, STREAM_HEARTBEAT_INTERVAL_MS);
  }, [clearHeartbeat]);

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
