import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { TrackWithMeta } from "@sonafrik/types";
import type { QueueState, RepeatMode } from "./playerTypes";
import {
  buildShuffledOrder,
  resolveNextQueueIndex,
  resolvePrevQueueIndex,
} from "./playerQueueUtils";

export type QueueControls = {
  setQueue: (tracks: TrackWithMeta[], startIndex?: number) => void;
  addToQueue: (track: TrackWithMeta) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  advanceQueue: () => TrackWithMeta | null;
  retreatQueue: () => TrackWithMeta | null;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

/** Factory sans hooks — évite 8× useCallback au mount de PlayerProvider. */
export function createPlayerQueueActions(
  setQueueState: Dispatch<SetStateAction<QueueState>>,
  shuffledOrderRef: MutableRefObject<number[]>,
  accumulatedListenSecondsRef: MutableRefObject<number>,
): QueueControls {
  return {
    setQueue: (tracks: TrackWithMeta[], startIndex = 0) => {
      setQueueState((prev) => {
        const order = prev.shuffle ? buildShuffledOrder(tracks.length, startIndex) : [];
        shuffledOrderRef.current = order;
        return { ...prev, queue: tracks, queueIndex: startIndex };
      });
    },

    addToQueue: (track: TrackWithMeta) => {
      setQueueState((prev) => ({ ...prev, queue: [...prev.queue, track] }));
    },

    removeFromQueue: (trackId: string) => {
      setQueueState((prev) => {
        const removeIndex = prev.queue.findIndex((t) => t.id === trackId);
        if (removeIndex < 0) return prev;
        const queue = prev.queue.filter((t) => t.id !== trackId);
        let queueIndex = prev.queueIndex;
        if (removeIndex < prev.queueIndex) {
          queueIndex -= 1;
        } else if (removeIndex === prev.queueIndex) {
          queueIndex = Math.min(queueIndex, queue.length - 1);
        }
        return { ...prev, queue, queueIndex };
      });
    },

    clearQueue: () => {
      setQueueState((prev) => ({ ...prev, queue: [], queueIndex: -1 }));
      shuffledOrderRef.current = [];
    },

    advanceQueue: (): TrackWithMeta | null => {
      let next: TrackWithMeta | null = null;

      setQueueState((prev) => {
        const resolved = resolveNextQueueIndex(
          prev.queue.length,
          prev.queueIndex,
          prev.shuffle,
          prev.repeatMode,
          shuffledOrderRef.current,
        );
        if (!resolved) return prev;
        shuffledOrderRef.current = resolved.shuffledOrder;
        next = prev.queue[resolved.nextIndex] ?? null;
        return { ...prev, queueIndex: resolved.nextIndex };
      });

      return next;
    },

    retreatQueue: (): TrackWithMeta | null => {
      let prevTrack: TrackWithMeta | null = null;

      setQueueState((prevState) => {
        const prevIndex = resolvePrevQueueIndex(
          prevState.queue.length,
          prevState.queueIndex,
          prevState.shuffle,
          prevState.repeatMode,
          shuffledOrderRef.current,
          accumulatedListenSecondsRef.current,
        );
        prevTrack = prevState.queue[prevIndex] ?? null;
        return { ...prevState, queueIndex: prevIndex };
      });

      return prevTrack;
    },

    toggleShuffle: () => {
      setQueueState((prev) => {
        const newShuffle = !prev.shuffle;
        if (newShuffle && prev.queue.length > 0) {
          shuffledOrderRef.current = buildShuffledOrder(prev.queue.length, prev.queueIndex);
        } else {
          shuffledOrderRef.current = [];
        }
        return { ...prev, shuffle: newShuffle };
      });
    },

    cycleRepeat: () => {
      setQueueState((prev) => {
        const next: RepeatMode =
          prev.repeatMode === "off" ? "all" : prev.repeatMode === "all" ? "one" : "off";
        return { ...prev, repeatMode: next };
      });
    },
  };
}
