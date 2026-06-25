import type { StreamingDomainEventType } from "../events";
import { createEventEnvelope } from "../events";
import type { DomainEventBusContract } from "../contracts";
import type { StreamingRuntimeContext } from "../runtime/streaming-runtime-context";

export async function publishPlaybackDomainEvent(
  bus: DomainEventBusContract,
  ctx: StreamingRuntimeContext,
  eventType: StreamingDomainEventType,
  payload: Record<string, unknown>,
  sessionId?: string,
  trackId?: string,
): Promise<void> {
  await bus.publish(
    createEventEnvelope({
      eventId: `${ctx.correlationId}:${eventType}:${Date.now()}`,
      eventType,
      correlationId: ctx.correlationId,
      actorId: ctx.actorId,
      sessionId: sessionId ?? ctx.sessionId,
      trackId: trackId ?? ctx.trackId,
      idempotencyKey: ctx.idempotencyKey,
      payload,
    }),
  );
}
