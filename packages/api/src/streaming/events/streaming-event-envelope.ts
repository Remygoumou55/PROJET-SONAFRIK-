import type { StreamingDomainEventType } from "./streaming-domain-events";
import { STREAMING_DOMAIN_EVENT_VERSION } from "./streaming-domain-events";

/** Enveloppe standard — DOMAIN_EVENTS.md §6.0 */
export interface StreamingDomainEventEnvelope<TPayload = Record<string, unknown>> {
  readonly eventId: string;
  readonly eventType: StreamingDomainEventType;
  readonly eventVersion: typeof STREAMING_DOMAIN_EVENT_VERSION | string;
  readonly correlationId: string;
  readonly sessionId?: string;
  readonly trackId?: string;
  readonly actorId: string;
  readonly occurredAt: string;
  readonly sequenceNumber?: number;
  readonly idempotencyKey?: string;
  readonly payload: TPayload;
}

export function createEventEnvelope<TPayload>(
  input: Omit<StreamingDomainEventEnvelope<TPayload>, "eventVersion" | "occurredAt"> & {
    occurredAt?: string;
  },
): StreamingDomainEventEnvelope<TPayload> {
  return {
    ...input,
    eventVersion: STREAMING_DOMAIN_EVENT_VERSION,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
}
