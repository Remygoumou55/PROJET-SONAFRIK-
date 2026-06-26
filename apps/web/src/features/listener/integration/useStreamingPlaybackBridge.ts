"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createStreamingPlaybackBridge,
  defaultBridgeRuntimeStatus,
  type RuntimeStatusDto,
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

export function useStreamingPlaybackBridge(): UseStreamingPlaybackBridgeResult {
  const client = getSupabaseBrowserClient();

  const bridge = useMemo(
    () =>
      createStreamingPlaybackBridge(client, {
        onObserve: logStreamingBridgeEvent,
      }),
    [client],
  );

  const [playbackMode, setPlaybackMode] = useState<StreamingPlaybackMode>("legacy");
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatusDto>(defaultBridgeRuntimeStatus());
  const [isBridgeReady, setIsBridgeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void bridge
      .initialize()
      .then(async () => {
        if (cancelled) return;
        setPlaybackMode(bridge.getPlaybackMode());
        const status = await bridge.refreshRuntimeStatus();
        if (cancelled) return;
        setRuntimeStatus(status);
        setIsBridgeReady(true);
      })
      .catch(() => {
        if (!cancelled) setIsBridgeReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [bridge]);

  return { bridge, playbackMode, runtimeStatus, isBridgeReady };
}
