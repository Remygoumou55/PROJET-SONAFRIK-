import type { PublicationEvent } from "../ports";

export function publicationRequestedEvent(
  actorId: string,
  correlationId: string,
  trackId: string,
  metadataId: string,
): PublicationEvent {
  return {
    type: "PublicationRequested",
    actorId,
    correlationId,
    trackId,
    metadataId,
    occurredAt: new Date().toISOString(),
  };
}

export function publicationValidatedEvent(
  actorId: string,
  correlationId: string,
  metadataId: string,
): PublicationEvent {
  return {
    type: "PublicationValidated",
    actorId,
    correlationId,
    metadataId,
    occurredAt: new Date().toISOString(),
  };
}

export function publicationPreparedEvent(
  actorId: string,
  correlationId: string,
  metadataId: string,
): PublicationEvent {
  return {
    type: "PublicationPrepared",
    actorId,
    correlationId,
    metadataId,
    occurredAt: new Date().toISOString(),
  };
}

export function publicationCancelledEvent(
  actorId: string,
  correlationId: string,
  metadataId: string,
  reason: string,
): PublicationEvent {
  return {
    type: "PublicationCancelled",
    actorId,
    correlationId,
    metadataId,
    reason,
    occurredAt: new Date().toISOString(),
  };
}

export function publicationReadyEvent(
  actorId: string,
  correlationId: string,
  metadataId: string,
): PublicationEvent {
  return {
    type: "PublicationReady",
    actorId,
    correlationId,
    metadataId,
    occurredAt: new Date().toISOString(),
  };
}
