"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { TrackWithMeta } from "@sonafrik/types";
import { REAL_LISTEN_THRESHOLD_PERCENT, STREAM_HEARTBEAT_INTERVAL_MS } from "@sonafrik/types";
import type {
  AudioErrorType,
  PlayerContextValue,
  PlayerStateCoreExtended,
  QueueState,
  StreamCompletePayload,
} from "./playerTypes";
import { INITIAL_PLAYER_STATE, INITIAL_QUEUE_STATE } from "./playerTypes";
import { usePlayerQueueControls } from "./usePlayerQueueControls";
export type { AudioErrorType } from "./playerTypes";

const PlayerContext = createContext<PlayerContextValue | null>(null);

// ── Context position (haute fréquence — ontimeupdate toutes les 250ms) ─────────
const PlayerPositionContext = createContext<number>(0);

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
  const onCompleteCallbackRef = useRef<((payload: StreamCompletePayload) => void) | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const activeDurationRef = useRef(0);
  const onErrorCallbackRef = useRef<((type: AudioErrorType, positionSeconds: number) => void) | null>(null);
  const accumulatedListenSecondsRef = useRef<number>(0);
  const shuffledOrderRef = useRef<number[]>([]);
  const loadGenerationRef = useRef(0);

  const clearAudioElement = useCallback((audio: HTMLAudioElement) => {
    audio.pause();
    audio.onerror = null;
    audio.oncanplay = null;
    audio.onloadedmetadata = null;
    audio.ontimeupdate = null;
    audio.onended = null;
    audio.removeAttribute("src");
    audio.load();
  }, []);

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
    (track: TrackWithMeta, signedUrl: string, sessionId: string, duration: number, autoPlay = false) => {
      const generation = ++loadGenerationRef.current;
      clearHeartbeat();
      accumulatedListenSecondsRef.current = 0;
      activeSessionIdRef.current = sessionId;
      activeDurationRef.current = duration;

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;
      clearAudioElement(audio);

      audio.preload = "auto";
      audio.volume = volumeRef.current;

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

      const startPlayback = () => {
        if (generation !== loadGenerationRef.current) return;
        void audio.play()
          .then(() => {
            if (generation !== loadGenerationRef.current) return;
            startHeartbeat();
            setState((prev) => ({ ...prev, isPlaying: true, isLoading: false, audioError: null }));
          })
          .catch((err: unknown) => {
            if (generation !== loadGenerationRef.current) return;
            console.error("[Player] Reprise audio échouée", err);
            setState((prev) => ({ ...prev, isPlaying: false, isLoading: false }));
          });
      };

      audio.onloadedmetadata = () => {
        if (generation !== loadGenerationRef.current) return;
        if (audio.duration > 0 && isFinite(audio.duration)) {
          setState((prev) => ({ ...prev, duration: audio.duration }));
        }
      };

      audio.oncanplay = () => {
        if (generation !== loadGenerationRef.current) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          duration: (audio.duration > 0 && isFinite(audio.duration)) ? audio.duration : prev.duration,
        }));
        if (autoPlay) startPlayback();
      };

      audio.ontimeupdate = () => {
        if (generation !== loadGenerationRef.current) return;
        positionRef.current = audio.currentTime;
        setCurrentPosition(audio.currentTime);
      };

      audio.onended = () => {
        if (generation !== loadGenerationRef.current) return;
        clearHeartbeat();
        setState((prev) => ({ ...prev, isPlaying: false }));
        const audioDuration =
          audio.duration > 0 && isFinite(audio.duration) ? audio.duration : activeDurationRef.current;
        const finalPos = audioDuration || positionRef.current;
        positionRef.current = finalPos;
        setCurrentPosition(finalPos);
        const sessionId = activeSessionIdRef.current;
        if (!sessionId) return;
        const totalDurationSeconds = Math.max(audioDuration, 1);
        const positionSeconds = Math.max(
          accumulatedListenSecondsRef.current,
          finalPos,
          totalDurationSeconds >= 1 ? totalDurationSeconds * 0.9 : 0,
        );
        onCompleteCallbackRef.current?.({
          sessionId,
          positionSeconds,
          totalDurationSeconds,
        });
      };

      audio.onerror = () => {
        if (generation !== loadGenerationRef.current) return;
        const mediaErr = audio.error;
        // Ignorer les erreurs transitoires lors d'un changement de piste
        if (mediaErr?.code === MediaError.MEDIA_ERR_ABORTED) return;
        const errorType: AudioErrorType =
          mediaErr?.code === MediaError.MEDIA_ERR_DECODE ||
          mediaErr?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ? "codec" :
          mediaErr?.code === MediaError.MEDIA_ERR_NETWORK ? "network" :
          "expired";
        const errorMsg =
          errorType === "codec"
            ? "Ce morceau ne peut pas être lu (fichier corrompu ou format incompatible)."
            : errorType === "network"
              ? "Erreur réseau — vérifiez votre connexion."
              : "Lien audio expiré. Nouvelle tentative…";
        console.error("[Player] Erreur audio", errorType, mediaErr?.code);
        clearHeartbeat();
        setState((prev) => ({ ...prev, isPlaying: false, isLoading: false, audioError: errorMsg }));
        onErrorCallbackRef.current?.(errorType, audio.currentTime);
      };

      audio.src = signedUrl;
      audio.load();
    },
    [clearHeartbeat, clearAudioElement, startHeartbeat],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    clearHeartbeat();
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, [clearHeartbeat]);

  const resume = useCallback(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const generation = loadGenerationRef.current;

    const startPlayback = () => {
      if (generation !== loadGenerationRef.current) return;
      void audio.play()
        .then(() => {
          if (generation !== loadGenerationRef.current) return;
          startHeartbeat();
          setState((prev) => ({ ...prev, isPlaying: true, isLoading: false, audioError: null }));
        })
        .catch((err: unknown) => {
          if (generation !== loadGenerationRef.current) return;
          console.error("[Player] Reprise audio échouée", err);
        });
    };

    setState((prev) => ({ ...prev, isLoading: true, audioError: null }));

    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      startPlayback();
    } else {
      audio.addEventListener("canplay", startPlayback, { once: true });
    }
  }, [startHeartbeat]);

  const stop = useCallback(() => {
    clearHeartbeat();
    activeSessionIdRef.current = null;
    activeDurationRef.current = 0;
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

  const onComplete = useCallback((cb: (payload: StreamCompletePayload) => void) => {
    onCompleteCallbackRef.current = cb;
  }, []);

  const onError = useCallback((cb: (type: AudioErrorType, positionSeconds: number) => void) => {
    onErrorCallbackRef.current = cb;
  }, []);

  const clearAudioError = useCallback(() => {
    setState((prev) => ({ ...prev, audioError: null }));
  }, []);

  const { setQueue, advanceQueue, retreatQueue, toggleShuffle, cycleRepeat } = usePlayerQueueControls(
    setQueueState,
    shuffledOrderRef,
    accumulatedListenSecondsRef,
  );

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
