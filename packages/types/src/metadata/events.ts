import type { MetadataID, TrackID, ReleaseID, DistributionID, RoyaltyID, FingerprintID } from "./ids";
import type { MetadataEntityType, MetadataStatus, MetadataValidationState } from "./enums";
import type { MetadataPipelineAction } from "./pipeline";

export const METADATA_EVENT_TYPE = {
  METADATA_CREATED: "metadata.created",
  METADATA_UPDATED: "metadata.updated",
  METADATA_VALIDATED: "metadata.validated",
  METADATA_PUBLISHED: "metadata.published",
  METADATA_ARCHIVED: "metadata.archived",
  METADATA_DELETED: "metadata.deleted",
  FINGERPRINT_GENERATED: "fingerprint.generated",
  ROYALTY_LINKED: "royalty.linked",
  DISTRIBUTION_READY: "distribution.ready",
} as const;

export type MetadataEventType = (typeof METADATA_EVENT_TYPE)[keyof typeof METADATA_EVENT_TYPE];

export interface MetadataEventBase {
  type: MetadataEventType;
  metadataId: MetadataID;
  occurredAt: string;
  actorId: string;
  correlationId: string;
}

export interface MetadataCreatedEvent extends MetadataEventBase {
  type: typeof METADATA_EVENT_TYPE.METADATA_CREATED;
  entityType: MetadataEntityType;
  entityId: string;
}

export interface MetadataUpdatedEvent extends MetadataEventBase {
  type: typeof METADATA_EVENT_TYPE.METADATA_UPDATED;
  changedFields: readonly string[];
}

export interface MetadataValidatedEvent extends MetadataEventBase {
  type: typeof METADATA_EVENT_TYPE.METADATA_VALIDATED;
  validationState: MetadataValidationState;
}

export interface MetadataPublishedEvent extends MetadataEventBase {
  type: typeof METADATA_EVENT_TYPE.METADATA_PUBLISHED;
  status: MetadataStatus;
}

export interface MetadataArchivedEvent extends MetadataEventBase {
  type: typeof METADATA_EVENT_TYPE.METADATA_ARCHIVED;
}

export interface MetadataDeletedEvent extends MetadataEventBase {
  type: typeof METADATA_EVENT_TYPE.METADATA_DELETED;
}

export interface FingerprintGeneratedEvent extends MetadataEventBase {
  type: typeof METADATA_EVENT_TYPE.FINGERPRINT_GENERATED;
  trackId: TrackID;
  fingerprintId: FingerprintID;
}

export interface RoyaltyLinkedEvent extends MetadataEventBase {
  type: typeof METADATA_EVENT_TYPE.ROYALTY_LINKED;
  royaltyId: RoyaltyID;
  trackId: TrackID | null;
}

export interface DistributionReadyEvent extends MetadataEventBase {
  type: typeof METADATA_EVENT_TYPE.DISTRIBUTION_READY;
  distributionId: DistributionID;
  releaseId: ReleaseID;
}

export type MetadataDomainEvent =
  | MetadataCreatedEvent
  | MetadataUpdatedEvent
  | MetadataValidatedEvent
  | MetadataPublishedEvent
  | MetadataArchivedEvent
  | MetadataDeletedEvent
  | FingerprintGeneratedEvent
  | RoyaltyLinkedEvent
  | DistributionReadyEvent;

export interface MetadataPipelineEvent extends MetadataEventBase {
  pipelineStep: string;
  pipelineAction: MetadataPipelineAction;
}
