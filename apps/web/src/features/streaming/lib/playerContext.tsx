"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type {
  AudioQualityKbps,
  PlayerState,
  StreamingPlatform,
  TrackWithMeta,
} from "@sonafrik/types";
import { REAL_LISTEN_THRESHOLD_PERCENT, STREAM_HEARTBEAT_INTERVAL_MS } from "@sonafrik/types";

type RepeatMode = "off" | "one" | "all";
export type AudioErrorType = "expired" | "network" | "codec";

interface QueueState {
  queue: TrackWithMeta[];
  queueIndex: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
}

interface PlayerActions {
  play: (track: TrackWithMeta, signedUrl: string, sessionId: string, duration: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  seek: (positionSeconds: number) => void;
  getAccumulatedListenSeconds: () => number;
  restartCurrentTrack: () => void;
  onHeartbeat: (callback: (positionSeconds: number) => void) => void;
  onComplete: (callback: () => void) => void;
  onError: (callback: (type: AudioErrorType, positionSeconds: number) => void) => void;
  clearAudioError: () => void;
  // Queue management
  setQueue: (tracks: TrackWithMeta[], startIndex?: number) => void;
  advanceQueue: () => TrackWithMeta | null;
  retreatQueue: () => TrackWithMeta | null;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

interface PlayerStateExtended extends PlayerState {
  audioError: string | null;
}

const initialState: PlayerStateExtended = {
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
  audioError: null,
};

interface PlayerContextValue extends PlayerStateExtended, QueueState, PlayerActions {}

const PlayerContext = createContext<PlayerContextValue | null>(null);

function buildShuffledOrder(length: number, currentIndex: number): number[] {
  const indices = Array.from({ length }, (_, i) => i).filter((i) => i !== currentIndex);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  return [currentIndex, ...indices];
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlayerStateExtended>(initialState);
  const [queueState, setQueueState] = useState<QueueState>({
    queue: [],
    queueIndex: -1,
    shuffle: false,
    repeatMode: "off",
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef<number>(1); // ref stable pour éviter la closure stale dans play()
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onHeartbeatCallbackRef = useRef<((pos: number) => void) | null>(null);
  const onCompleteCallbackRef = useRef<(() => void) | null>(null);
  const onErrorCallbackRef = useRef<((type: AudioErrorType, positionSeconds: number) => void) | null>(null);
  const accumulatedListenSecondsRef = useRef<number>(0);
  // Shuffled play order (indices into queue array)
  const shuffledOrderRef = useRef<number[]>([]);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

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
      audio.volume = volumeRef.current; // volumeRef évite la closure stale sur state.volume
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
        audioError: null,
      }));

      audio.play().catch((err: unknown) => {
        const isAbort = (err as { name?: string })?.name === "AbortError";
        if (isAbort) {
          // Interruption normale (nouvelle source chargée) — pas une erreur visible
          setState((prev) => ({ ...prev, isPlaying: false, isLoading: false }));
        } else {
          // Autoplay bloqué par le navigateur ou erreur inattendue
          console.error("[Player] Lecture audio échouée", err);
          const msg = "Lecture bloquée. Appuyez sur play pour démarrer.";
          setState((prev) => ({ ...prev, isPlaying: false, isLoading: false, audioError: msg }));
          onErrorCallbackRef.current?.("network", 0);
        }
      });

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

      // URL signée expirée ou source inaccessible
      audio.onerror = () => {
        const mediaErr = audio.error;
        // MEDIA_ERR_DECODE (3) = problème codec ; tout le reste = réseau/URL expirée
        const errorType: AudioErrorType =
          mediaErr?.code === MediaError.MEDIA_ERR_DECODE ? "codec" :
          mediaErr?.code === MediaError.MEDIA_ERR_ABORTED ? "network" :
          "expired";
        const errorMsg =
          errorType === "codec"   ? "Format audio non supporté." :
          errorType === "network" ? "Erreur réseau — vérifiez votre connexion." :
                                    "Lien audio expiré. Rechargement en cours…";
        console.error("[Player] Erreur audio", errorType, mediaErr?.code);
        clearHeartbeat();
        setState((prev) => ({ ...prev, isPlaying: false, isLoading: false, audioError: errorMsg }));
        onErrorCallbackRef.current?.(errorType, audio.currentTime);
      };

      startHeartbeat();
    },
    [clearHeartbeat, startHeartbeat],
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
    volumeRef.current = clampedVolume; // maintenir le ref en sync avec l'état
    if (audioRef.current) audioRef.current.volume = clampedVolume;
    setState((prev) => ({ ...prev, volume: clampedVolume }));
  }, []);

  const seek = useCallback((positionSeconds: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(positionSeconds, audioRef.current.duration || 0));
    audioRef.current.currentTime = clamped;
    setState((prev) => ({ ...prev, currentPosition: clamped }));
  }, []);

  const getAccumulatedListenSeconds = useCallback(() => {
    return accumulatedListenSecondsRef.current;
  }, []);

  // Remet la piste courante à 0 sans créer une nouvelle session streaming
  // Utilisé par playPrev quand > 3s de lecture ont été accumulées
  const restartCurrentTrack = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    accumulatedListenSecondsRef.current = 0;
    setState((prev) => ({ ...prev, currentPosition: 0 }));
  }, []);

  const onHeartbeat = useCallback((cb: (pos: number) => void) => {
    onHeartbeatCallbackRef.current = cb;
  }, []);

  const onComplete = useCallback((cb: () => void) => {
    onCompleteCallbackRef.current = cb;
  }, []);

  const onError = useCallback((cb: (type: AudioErrorType, positionSeconds: number) => void) => {
    onErrorCallbackRef.current = cb;
  }, []);

  const clearAudioError = useCallback(() => {
    setState((prev) => ({ ...prev, audioError: null }));
  }, []);

  // ── Queue Management ────────────────────────────────────────────────────────

  const setQueue = useCallback((tracks: TrackWithMeta[], startIndex = 0) => {
    setQueueState((prev) => {
      const order = prev.shuffle ? buildShuffledOrder(tracks.length, startIndex) : [];
      shuffledOrderRef.current = order;
      return { ...prev, queue: tracks, queueIndex: startIndex };
    });
  }, []);

  const advanceQueue = useCallback((): TrackWithMeta | null => {
    let next: TrackWithMeta | null = null;

    setQueueState((prev) => {
      const { queue, queueIndex, shuffle, repeatMode } = prev;
      if (!queue.length) return prev;

      if (repeatMode === "one") {
        next = queue[queueIndex] ?? null;
        return prev;
      }

      let nextIndex: number;
      if (shuffle) {
        const pos = shuffledOrderRef.current.indexOf(queueIndex);
        const nextPos = pos + 1;
        if (nextPos >= shuffledOrderRef.current.length) {
          if (repeatMode === "all") {
            // Re-shuffle and start again
            shuffledOrderRef.current = buildShuffledOrder(queue.length, shuffledOrderRef.current[0] ?? 0);
            nextIndex = shuffledOrderRef.current[0] ?? 0;
          } else {
            return prev;
          }
        } else {
          nextIndex = shuffledOrderRef.current[nextPos] ?? 0;
        }
      } else {
        nextIndex = queueIndex + 1;
        if (nextIndex >= queue.length) {
          if (repeatMode === "all") {
            nextIndex = 0;
          } else {
            return prev;
          }
        }
      }

      next = queue[nextIndex] ?? null;
      return { ...prev, queueIndex: nextIndex };
    });

    return next;
  }, []);

  const retreatQueue = useCallback((): TrackWithMeta | null => {
    let prev: TrackWithMeta | null = null;

    setQueueState((prevState) => {
      const { queue, queueIndex, shuffle, repeatMode } = prevState;
      if (!queue.length) return prevState;

      // If > 3s played, restart current track instead of going back
      if (accumulatedListenSecondsRef.current > 3) {
        prev = queue[queueIndex] ?? null;
        return prevState;
      }

      let prevIndex: number;
      if (shuffle) {
        const pos = shuffledOrderRef.current.indexOf(queueIndex);
        prevIndex = pos > 0
          ? (shuffledOrderRef.current[pos - 1] ?? 0)
          : repeatMode === "all" ? (shuffledOrderRef.current[shuffledOrderRef.current.length - 1] ?? 0) : queueIndex;
      } else {
        prevIndex = queueIndex - 1;
        if (prevIndex < 0) {
          prevIndex = repeatMode === "all" ? queue.length - 1 : 0;
        }
      }

      prev = queue[prevIndex] ?? null;
      return { ...prevState, queueIndex: prevIndex };
    });

    return prev;
  }, []);

  const toggleShuffle = useCallback(() => {
    setQueueState((prev) => {
      const newShuffle = !prev.shuffle;
      if (newShuffle && prev.queue.length > 0) {
        shuffledOrderRef.current = buildShuffledOrder(prev.queue.length, prev.queueIndex);
      } else {
        shuffledOrderRef.current = [];
      }
      return { ...prev, shuffle: newShuffle };
    });
  }, []);

  const cycleRepeat = useCallback(() => {
    setQueueState((prev) => {
      const next: RepeatMode = prev.repeatMode === "off" ? "all" : prev.repeatMode === "all" ? "one" : "off";
      return { ...prev, repeatMode: next };
    });
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
        ...queueState,
        play,
        pause,
        resume,
        stop,
        setVolume,
        seek,
        getAccumulatedListenSeconds,
        restartCurrentTrack,
        onHeartbeat,
        onComplete,
        onError,
        clearAudioError,
        setQueue,
        advanceQueue,
        retreatQueue,
        toggleShuffle,
        cycleRepeat,
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
