import type { RepeatMode } from "./playerTypes";

export function buildShuffledOrder(length: number, currentIndex: number): number[] {
  const indices = Array.from({ length }, (_, i) => i).filter((i) => i !== currentIndex);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  return [currentIndex, ...indices];
}

export function resolveNextQueueIndex(
  queueLength: number,
  queueIndex: number,
  shuffle: boolean,
  repeatMode: RepeatMode,
  shuffledOrder: number[],
): { nextIndex: number; shuffledOrder: number[] } | null {
  if (!queueLength) return null;
  if (repeatMode === "one") return { nextIndex: queueIndex, shuffledOrder };

  if (shuffle) {
    const pos = shuffledOrder.indexOf(queueIndex);
    const nextPos = pos + 1;
    if (nextPos >= shuffledOrder.length) {
      if (repeatMode === "all") {
        const order = buildShuffledOrder(queueLength, queueIndex);
        return { nextIndex: order[1] ?? queueIndex, shuffledOrder: order };
      }
      return null;
    }
    return { nextIndex: shuffledOrder[nextPos] ?? 0, shuffledOrder };
  }

  const nextIndex = queueIndex + 1;
  if (nextIndex >= queueLength) {
    return repeatMode === "all" ? { nextIndex: 0, shuffledOrder } : null;
  }
  return { nextIndex, shuffledOrder };
}

export function resolvePrevQueueIndex(
  queueLength: number,
  queueIndex: number,
  shuffle: boolean,
  repeatMode: RepeatMode,
  shuffledOrder: number[],
  accumulatedListenSeconds: number,
): number {
  if (!queueLength) return queueIndex;
  if (accumulatedListenSeconds > 3) return queueIndex;

  if (shuffle) {
    const pos = shuffledOrder.indexOf(queueIndex);
    if (pos > 0) return shuffledOrder[pos - 1] ?? queueIndex;
    return repeatMode === "all"
      ? (shuffledOrder[shuffledOrder.length - 1] ?? queueIndex)
      : queueIndex;
  }

  const prevIndex = queueIndex - 1;
  if (prevIndex < 0) return repeatMode === "all" ? queueLength - 1 : 0;
  return prevIndex;
}
