"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { TrackWithMeta } from "@sonafrik/types";
import { REAL_LISTEN_THRESHOLD_PERCENT } from "@sonafrik/types";
import type {
  AudioErrorType,
  PlayerActions,
  PlayerContextValue,
  PlayerStateCoreExtended,
  QueueState,
  StreamCompletePayload,
} from "./playerTypes";
import type { StreamCompleteMode } from "@sonafrik/shared/streaming";
import { INITIAL_PLAYER_STATE, INITIAL_QUEUE_STATE } from "./playerTypes";
import { createPlayerQueueActions } from "./usePlayerQueueControls";
import { useStablePlayerActions } from "./useStablePlayerActions";
import {
  buildCompletePayload,
  clearAudioElement,
  createStreamHeartbeat,
  resolveTrackDurationSeconds,
} from "./playerSessionLifecycle";
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
  const onHeartbeatCallbackRef = useRef<((pos: number) => void) | null>(null);
  const onCompleteCallbackRef = useRef<((payload: StreamCompletePayload) => void) | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const activeDurationRef = useRef(0);
  const onErrorCallbackRef = useRef<((type: AudioErrorType, positionSeconds: number) => void) | null>(null);
  const accumulatedListenSecondsRef = useRef<number>(0);
  const shuffledOrderRef = useRef<number[]>([]);
  const loadGenerationRef = useRef(0);

  const heartbeatCtl = useMemo(
    () => createStreamHeartbeat(audioRef, accumulatedListenSecondsRef, onHeartbeatCallbackRef),
    [],
  );

  const stableActions = useStablePlayerActions((): PlayerActions => {
    const resolveDurationSeconds = (): number =>
      resolveTrackDurationSeconds(audioRef.current, activeDurationRef);

    const takeCompletePayload = (mode: StreamCompleteMode = "manual"): StreamCompletePayload | null => {
      const sessionId = activeSessionIdRef.current;
      if (!sessionId) return null;

      activeSessionIdRef.current = null;

      return buildCompletePayload(
        sessionId,
        positionRef.current,
        accumulatedListenSecondsRef.current,
        resolveDurationSeconds(),
        mode,
      );
    };

    const queueActions = createPlayerQueueActions(
      setQueueState,
      shuffledOrderRef,
      accumulatedListenSecondsRef,
    );

    return {
      ...queueActions,

      play: (track: TrackWithMeta, signedUrl: string, sessionId: string, duration: number, autoPlay = false) => {
        const generation = ++loadGenerationRef.current;
        heartbeatCtl.clear();
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
          void audio
            .play()
            .then(() => {
              if (generation !== loadGenerationRef.current) return;
              heartbeatCtl.start();
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
            duration: audio.duration > 0 && isFinite(audio.duration) ? audio.duration : prev.duration,
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
          heartbeatCtl.clear();
          setState((prev) => ({ ...prev, isPlaying: false }));
          const payload = takeCompletePayload("natural");
          if (payload) {
            onCompleteCallbackRef.current?.({ ...payload, advanceQueue: true });
          }
        };

        audio.onerror = () => {
          if (generation !== loadGenerationRef.current) return;
          const mediaErr = audio.error;
          if (mediaErr?.code === MediaError.MEDIA_ERR_ABORTED) return;
          const errorType: AudioErrorType =
            mediaErr?.code === MediaError.MEDIA_ERR_DECODE
              ? "codec"
              : mediaErr?.code === MediaError.MEDIA_ERR_NETWORK
                ? "network"
                : "expired";
          const errorMsg =
            errorType === "codec"
              ? "Ce morceau ne peut pas être lu (fichier corrompu ou format incompatible)."
              : errorType === "network"
                ? "Erreur réseau — vérifiez votre connexion."
                : "Lecture interrompue. Nouvelle tentative…";
          if (process.env.NODE_ENV === "development" && errorType === "codec") {
            console.error("[Player] Erreur audio", errorType, mediaErr?.code);
          }
          heartbeatCtl.clear();
          setState((prev) => ({ ...prev, isPlaying: false, isLoading: false, audioError: errorMsg }));
          onErrorCallbackRef.current?.(errorType, audio.currentTime);
        };

        audio.src = signedUrl;
        audio.load();
      },

      pause: () => {
        audioRef.current?.pause();
        heartbeatCtl.clear();
        setState((prev) => ({ ...prev, isPlaying: false }));
      },

      resume: () => {
        if (!audioRef.current) return;
        const audio = audioRef.current;
        const generation = loadGenerationRef.current;

        const startPlayback = () => {
          if (generation !== loadGenerationRef.current) return;
          void audio
            .play()
            .then(() => {
              if (generation !== loadGenerationRef.current) return;
              heartbeatCtl.start();
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
      },

      stop: () => {
        heartbeatCtl.clear();
        const payload = takeCompletePayload("manual");
        if (payload) {
          onCompleteCallbackRef.current?.(payload);
        }
        activeDurationRef.current = 0;
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        setState(INITIAL_PLAYER_STATE);
        positionRef.current = 0;
        setCurrentPosition(0);
      },

      setVolume: (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        volumeRef.current = clampedVolume;
        if (audioRef.current) audioRef.current.volume = clampedVolume;
        setState((prev) => ({ ...prev, volume: clampedVolume }));
      },

      seek: (positionSeconds: number) => {
        if (!audioRef.current) return;
        const clamped = Math.max(0, Math.min(positionSeconds, audioRef.current.duration || 0));
        audioRef.current.currentTime = clamped;
        positionRef.current = clamped;
        setCurrentPosition(clamped);
      },

      getPosition: () => positionRef.current,

      getAccumulatedListenSeconds: () => accumulatedListenSecondsRef.current,

      restartCurrentTrack: () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = 0;
        accumulatedListenSecondsRef.current = 0;
        positionRef.current = 0;
        setCurrentPosition(0);
      },

      takeCompletePayload,

      onHeartbeat: (cb: (pos: number) => void) => {
        onHeartbeatCallbackRef.current = cb;
      },

      onComplete: (cb: (payload: StreamCompletePayload) => void) => {
        onCompleteCallbackRef.current = cb;
      },

      onError: (cb: (type: AudioErrorType, positionSeconds: number) => void) => {
        onErrorCallbackRef.current = cb;
      },

      clearAudioError: () => {
        setState((prev) => ({ ...prev, audioError: null }));
      },
    };
  });

  const contextValue = useMemo<PlayerContextValue>(
    () => ({
      ...state,
      ...queueState,
      ...stableActions,
    }),
    [state, queueState, stableActions],
  );

  useEffect(() => {
    return () => {
      heartbeatCtl.clear();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [heartbeatCtl]);

  return (
    <PlayerContext.Provider value={contextValue}>
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
