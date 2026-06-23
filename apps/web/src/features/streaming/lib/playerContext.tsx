"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { TrackWithMeta } from "@sonafrik/types";
import { REAL_LISTEN_THRESHOLD_PERCENT, STREAM_HEARTBEAT_INTERVAL_MS } from "@sonafrik/types";
import type {
  AudioErrorType,
  PlayerContextValue,
  PlayerStateCoreExtended,
  QueueState,
  RepeatMode,
} from "./playerTypes";
import { INITIAL_PLAYER_STATE, INITIAL_QUEUE_STATE } from "./playerTypes";

export type { AudioErrorType } from "./playerTypes";

const PlayerContext = createContext<PlayerContextValue | null>(null);

// ── Context position (haute fréquence — ontimeupdate toutes les 250ms) ─────────
// Isolé pour éviter que les re-renders de la barre de progression touchent
// PlayerControls, SearchResults, AlbumTracksClient, etc.
const PlayerPositionContext = createContext<number>(0);

function buildShuffledOrder(length: number, currentIndex: number): number[] {
  const indices = Array.from({ length }, (_, i) => i).filter((i) => i !== currentIndex);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  return [currentIndex, ...indices];
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlayerStateCoreExtended>(INITIAL_PLAYER_STATE);
  const [queueState, setQueueState] = useState<QueueState>(INITIAL_QUEUE_STATE);

  // État position séparé — seul PlayerPositionContext le consomme
  const [currentPosition, setCurrentPosition] = useState(0);
  // Ref pour lire la position sans créer de subscription (utilisé par getPosition + pauseAndSave)
  const positionRef = useRef(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef<number>(1);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onHeartbeatCallbackRef = useRef<((pos: number) => void) | null>(null);
  const onCompleteCallbackRef = useRef<(() => void) | null>(null);
  const onErrorCallbackRef = useRef<((type: AudioErrorType, positionSeconds: number) => void) | null>(null);
  const accumulatedListenSecondsRef = useRef<number>(0);
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
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audio.src = signedUrl;
      audio.volume = volumeRef.current;
      audio.load();

      // Reset position — ne fait partie que du context position
      positionRef.current = 0;
      setCurrentPosition(0);

      setState((prev) => ({
        ...prev,
        currentTrack: track,
        sessionId,
        signedUrl,
        isPlaying: false,
        isLoading: true,
        duration,
        audioError: null,
      }));

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

      // Mise à jour haute-fréquence : uniquement le context position
      audio.ontimeupdate = () => {
        positionRef.current = audio.currentTime;
        setCurrentPosition(audio.currentTime);
      };

      audio.onended = () => {
        clearHeartbeat();
        setState((prev) => ({ ...prev, isPlaying: false }));
        const finalPos = audio.duration || 0;
        positionRef.current = finalPos;
        setCurrentPosition(finalPos);
        onCompleteCallbackRef.current?.();
      };

      audio.onerror = () => {
        const mediaErr = audio.error;
        const errorType: AudioErrorType =
          mediaErr?.code === MediaError.MEDIA_ERR_DECODE ||
          mediaErr?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ? "codec" :
          mediaErr?.code === MediaError.MEDIA_ERR_NETWORK ? "network" :
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

      // Lecture démarrée via resume() — conserve le geste utilisateur après stream-start async.
    },
    [clearHeartbeat],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    clearHeartbeat();
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, [clearHeartbeat]);

  const resume = useCallback(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    setState((prev) => ({ ...prev, isPlaying: true, isLoading: false, audioError: null }));

    const startPlayback = () => {
      audio.play().catch((err: unknown) => { console.error("[Player] Reprise audio échouée", err); });
      startHeartbeat();
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      startPlayback();
    } else {
      audio.addEventListener("canplay", startPlayback, { once: true });
    }
  }, [startHeartbeat]);

  const stop = useCallback(() => {
    clearHeartbeat();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setState(INITIAL_PLAYER_STATE);
    positionRef.current = 0;
    setCurrentPosition(0);
  }, [clearHeartbeat]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    volumeRef.current = clampedVolume;
    if (audioRef.current) audioRef.current.volume = clampedVolume;
    setState((prev) => ({ ...prev, volume: clampedVolume }));
  }, []);

  const seek = useCallback((positionSeconds: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(positionSeconds, audioRef.current.duration || 0));
    audioRef.current.currentTime = clamped;
    positionRef.current = clamped;
    setCurrentPosition(clamped);
  }, []);

  // Lit la position depuis le ref — pas de subscription au re-render cycle
  const getPosition = useCallback(() => positionRef.current, []);

  const getAccumulatedListenSeconds = useCallback(() => {
    return accumulatedListenSecondsRef.current;
  }, []);

  const restartCurrentTrack = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    accumulatedListenSecondsRef.current = 0;
    positionRef.current = 0;
    setCurrentPosition(0);
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
        getPosition,
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
      <PlayerPositionContext.Provider value={currentPosition}>
        {children}
      </PlayerPositionContext.Provider>
    </PlayerContext.Provider>
  );
}

export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayerContext must be inside PlayerProvider");
  return ctx;
}

// Hook position haute-fréquence — à utiliser UNIQUEMENT dans les composants
// qui affichent la progression (WebPlayer progress bar).
// Tous les autres composants utilisent usePlayerContext() qui ne re-render pas sur position.
export function usePlayerPosition(): number {
  return useContext(PlayerPositionContext);
}

export { REAL_LISTEN_THRESHOLD_PERCENT };
