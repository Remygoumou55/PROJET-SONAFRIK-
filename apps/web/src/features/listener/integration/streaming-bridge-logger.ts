import type { StreamingBridgeObserveEvent } from "@sonafrik/api/streaming";

/** Logs structurés bridge — développement uniquement */
export function logStreamingBridgeEvent(event: StreamingBridgeObserveEvent): void {
  if (process.env.NODE_ENV !== "development") return;

  const payload = {
    tag: "StreamingBridge",
    type: event.type,
    mode: event.mode,
    correlationId: event.correlationId,
    playbackId: event.playbackId,
    trackId: event.trackId,
    sessionId: event.sessionId,
    runtimeEnabled: event.runtimeStatus?.runtimeEnabled,
    registeredHandlers: event.runtimeStatus?.registeredHandlers?.length,
  };

  console.info("[StreamingBridge]", payload);
}
