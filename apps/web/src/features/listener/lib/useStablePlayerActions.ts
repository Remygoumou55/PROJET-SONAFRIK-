import { useMemo, useRef } from "react";
import type { PlayerActions } from "./playerTypes";

const PLAYER_ACTION_KEYS: readonly (keyof PlayerActions)[] = [
  "play",
  "pause",
  "resume",
  "stop",
  "setVolume",
  "seek",
  "getPosition",
  "getAccumulatedListenSeconds",
  "restartCurrentTrack",
  "takeCompletePayload",
  "onHeartbeat",
  "onComplete",
  "onError",
  "clearAudioError",
  "setQueue",
  "addToQueue",
  "removeFromQueue",
  "clearQueue",
  "advanceQueue",
  "retreatQueue",
  "toggleShuffle",
  "cycleRepeat",
];

function createStableActionProxy(actionsRef: { current: PlayerActions }): PlayerActions {
  const proxy = {} as Record<keyof PlayerActions, PlayerActions[keyof PlayerActions]>;
  for (const key of PLAYER_ACTION_KEYS) {
    proxy[key] = ((...args: unknown[]) =>
      (actionsRef.current[key] as (...a: unknown[]) => unknown)(...args)) as PlayerActions[typeof key];
  }
  return proxy as PlayerActions;
}

/**
 * Proxy stable (1× useMemo) — remplace 20+ useCallback au mount de PlayerProvider.
 * Les implémentations fraîches vivent dans actionsRef, mis à jour à chaque render.
 */
export function useStablePlayerActions(factory: () => PlayerActions): PlayerActions {
  const actionsRef = useRef<PlayerActions>(null!);
  actionsRef.current = factory();

  return useMemo(() => createStableActionProxy(actionsRef), []);
}
