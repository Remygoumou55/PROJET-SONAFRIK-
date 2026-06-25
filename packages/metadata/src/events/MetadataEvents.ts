import type { MetadataDomainEvent, MetadataPipelineEvent } from "@sonafrik/types";

/** Event bus contract — Phase 2+ will connect to audit_logs / notifications */
export interface MetadataEventPublisher {
  publish(event: MetadataDomainEvent): Promise<void>;
  publishPipeline(event: MetadataPipelineEvent): Promise<void>;
}

export interface MetadataEventSubscriber {
  onDomainEvent(handler: (event: MetadataDomainEvent) => Promise<void>): void;
  onPipelineEvent(handler: (event: MetadataPipelineEvent) => Promise<void>): void;
}
