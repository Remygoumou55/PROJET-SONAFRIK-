"use client";

import { useRef, useState, useMemo } from "react";
import {
  createStreamingPlaybackBridge,
  defaultBridgeRuntimeStatus,
  type RuntimeStatusDto,
  type StreamingBridgeObserveEvent,
  type StreamingPlaybackBridge,
  type StreamingPlaybackMode,
} from "@sonafrik/api/streaming";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { logStreamingBridgeEvent } from "./streaming-bridge-logger";

export interface UseStreamingPlaybackBridgeResult {
  readonly bridge: StreamingPlaybackBridge;
  readonly playbackMode: StreamingPlaybackMode;
  readonly runtimeStatus: RuntimeStatusDto;
  readonly isBridgeReady: boolean;
}

/**
 * Bridge streaming — initialisation lazy via `StreamingPlaybackBridge.startStream()`
 * (appelle `initialize()` au premier Play réel, pas au mount page).
 * L'état du bridge est surfacé dans React state via onObserve.
 */
export function useStreamingPlaybackBridge(): UseStreamingPlaybackBridgeResult {
  const client = getSupabaseBrowserClient();

  const [playbackMode, setPlaybackMode] = useState<StreamingPlaybackMode>("legacy");
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatusDto>(
    defaultBridgeRuntimeStatus(),
  );
  const [isBridgeReady, setIsBridgeReady] = useState(false);

  // Ref to avoid stale closures in the bridge's onObserve callback
  // (React guarantees setter stability but ESLint exhaustive-deps may warn)
  const settersRef = useRef({ setPlaybackMode, setRuntimeStatus, setIsBridgeReady });
  settersRef.current = { setPlaybackMode, setRuntimeStatus, setIsBridgeReady };

  const bridge = useMemo(
    () =>
      createStreamingPlaybackBridge(client, {
        onObserve: (event: StreamingBridgeObserveEvent) => {
          logStreamingBridgeEvent(event);

          if (event.type === "initialized") {
            settersRef.current.setPlaybackMode(event.mode);
            if (event.runtimeStatus) {
              settersRef.current.setRuntimeStatus(event.runtimeStatus);
            }
            settersRef.current.setIsBridgeReady(true);
          } else if (event.runtimeStatus) {
            settersRef.current.setPlaybackMode(event.mode);
            settersRef.current.setRuntimeStatus(event.runtimeStatus);
          }
        },
      }),
    [client],
  );

  return { bridge, playbackMode, runtimeStatus, isBridgeReady };
}
