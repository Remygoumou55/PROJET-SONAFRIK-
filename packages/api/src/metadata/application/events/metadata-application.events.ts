import type { MetadataApplicationEvent } from "../ports";

export function metadataCreatedEvent(
  actorId: string,
  correlationId: string,
  metadataId: string,
): MetadataApplicationEvent {
  return {
    type: "MetadataCreated",
    actorId,
    correlationId,
    metadataId,
    occurredAt: new Date().toISOString(),
  };
}

export function metadataValidatedEvent(
  actorId: string,
  correlationId: string,
  metadataId: string,
): MetadataApplicationEvent {
  return {
    type: "MetadataValidated",
    actorId,
    correlationId,
    metadataId,
    occurredAt: new Date().toISOString(),
  };
}

export function metadataReservedEvent(
  actorId: string,
  correlationId: string,
  isrc: string,
): MetadataApplicationEvent {
  return {
    type: "MetadataReserved",
    actorId,
    correlationId,
    isrc,
    occurredAt: new Date().toISOString(),
  };
}

export function metadataArchivedEvent(
  actorId: string,
  correlationId: string,
  metadataId: string,
): MetadataApplicationEvent {
  return {
    type: "MetadataArchived",
    actorId,
    correlationId,
    metadataId,
    occurredAt: new Date().toISOString(),
  };
}

export function metadataReleasedEvent(
  actorId: string,
  correlationId: string,
  isrc: string,
): MetadataApplicationEvent {
  return {
    type: "MetadataReleased",
    actorId,
    correlationId,
    isrc,
    occurredAt: new Date().toISOString(),
  };
}

export function metadataRestoredEvent(
  actorId: string,
  correlationId: string,
  metadataId: string,
): MetadataApplicationEvent {
  return {
    type: "MetadataRestored",
    actorId,
    correlationId,
    metadataId,
    occurredAt: new Date().toISOString(),
  };
}
