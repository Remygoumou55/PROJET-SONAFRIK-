import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { TrackWithMeta } from "@sonafrik/types";
import type { QueueState, RepeatMode } from "./playerTypes";
import {
  buildShuffledOrder,
  resolveNextQueueIndex,
  resolvePrevQueueIndex,
} from "./playerQueueUtils";

type QueueControls = {
  setQueue: (tracks: TrackWithMeta[], startIndex?: number) => void;
  addToQueue: (track: TrackWithMeta) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  advanceQueue: () => TrackWithMeta | null;
  retreatQueue: () => TrackWithMeta | null;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

export function usePlayerQueueControls(
  setQueueState: Dispatch<SetStateAction<QueueState>>,
  shuffledOrderRef: MutableRefObject<number[]>,
  accumulatedListenSecondsRef: MutableRefObject<number>,
): QueueControls {
  const setQueue = useCallback((tracks: TrackWithMeta[], startIndex = 0) => {
    setQueueState((prev) => {
      const order = prev.shuffle ? buildShuffledOrder(tracks.length, startIndex) : [];
      shuffledOrderRef.current = order;
      return { ...prev, queue: tracks, queueIndex: startIndex };
    });
  }, [setQueueState, shuffledOrderRef]);

  const addToQueue = useCallback((track: TrackWithMeta) => {
    setQueueState((prev) => ({ ...prev, queue: [...prev.queue, track] }));
  }, [setQueueState]);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueueState((prev) => {
      const removeIndex = prev.queue.findIndex((track) => track.id === trackId);
      if (removeIndex < 0) return prev;
      const queue = prev.queue.filter((track) => track.id !== trackId);
      let queueIndex = prev.queueIndex;
      if (removeIndex < prev.queueIndex) {
        queueIndex -= 1;
      } else if (removeIndex === prev.queueIndex) {
        queueIndex = Math.min(queueIndex, queue.length - 1);
      }
      return { ...prev, queue, queueIndex };
    });
  }, [setQueueState]);

  const clearQueue = useCallback(() => {
    setQueueState((prev) => ({ ...prev, queue: [], queueIndex: -1 }));
    shuffledOrderRef.current = [];
  }, [setQueueState, shuffledOrderRef]);

  const advanceQueue = useCallback((): TrackWithMeta | null => {
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
  }, [setQueueState, shuffledOrderRef]);

  const retreatQueue = useCallback((): TrackWithMeta | null => {
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
  }, [accumulatedListenSecondsRef, setQueueState, shuffledOrderRef]);

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
  }, [setQueueState, shuffledOrderRef]);

  const cycleRepeat = useCallback(() => {
    setQueueState((prev) => {
      const next: RepeatMode = prev.repeatMode === "off" ? "all" : prev.repeatMode === "all" ? "one" : "off";
      return { ...prev, repeatMode: next };
    });
  }, [setQueueState]);

  return { setQueue, addToQueue, removeFromQueue, clearQueue, advanceQueue, retreatQueue, toggleShuffle, cycleRepeat };
}
