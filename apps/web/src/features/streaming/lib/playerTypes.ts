import type { AudioQualityKbps, PlayerState, StreamingPlatform, TrackWithMeta } from "@sonafrik/types";

export type RepeatMode = "off" | "one" | "all";
export type AudioErrorType = "expired" | "network" | "codec";

export interface QueueState {
  queue: TrackWithMeta[];
  queueIndex: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
}

export interface PlayerActions {
  play: (track: TrackWithMeta, signedUrl: string, sessionId: string, duration: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  seek: (positionSeconds: number) => void;
  getPosition: () => number;
  getAccumulatedListenSeconds: () => number;
  restartCurrentTrack: () => void;
  onHeartbeat: (callback: (positionSeconds: number) => void) => void;
  onComplete: (callback: () => void) => void;
  onError: (callback: (type: AudioErrorType, positionSeconds: number) => void) => void;
  clearAudioError: () => void;
  setQueue: (tracks: TrackWithMeta[], startIndex?: number) => void;
  advanceQueue: () => TrackWithMeta | null;
  retreatQueue: () => TrackWithMeta | null;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

// currentPosition retiré du state principal — il est dans PlayerPositionContext
export type PlayerStateCoreExtended = Omit<PlayerState, "currentPosition"> & {
  audioError: string | null;
};

export interface PlayerContextValue extends PlayerStateCoreExtended, QueueState, PlayerActions {}

export const INITIAL_PLAYER_STATE: PlayerStateCoreExtended = {
  currentTrack: null,
  sessionId: null,
  signedUrl: null,
  isPlaying: false,
  isLoading: false,
  duration: 0,
  volume: 1,
  platform: "web" as StreamingPlatform,
  quality: 128 as AudioQualityKbps,
  audioError: null,
};

export const INITIAL_QUEUE_STATE: QueueState = {
  queue: [],
  queueIndex: -1,
  shuffle: false,
  repeatMode: "off",
};
