import type { MetadataRepositoryBundle } from "@sonafrik/persistence/contracts";
import type { InMemoryTransactionManager } from "@sonafrik/persistence";

/** Port — application layer depends on abstractions, not Supabase */
export interface MetadataApplicationPorts {
  readonly repositories: MetadataRepositoryBundle;
  readonly transactionManager: InMemoryTransactionManager;
}

export interface ApplicationEventPublisher {
  publish<T extends MetadataApplicationEvent>(event: T): Promise<void>;
}

export type MetadataApplicationEventType =
  | "MetadataCreated"
  | "MetadataValidated"
  | "MetadataReserved"
  | "MetadataArchived"
  | "MetadataReleased"
  | "MetadataRestored";

export interface MetadataApplicationEvent {
  readonly type: MetadataApplicationEventType;
  readonly actorId: string;
  readonly correlationId: string;
  readonly metadataId?: string;
  readonly isrc?: string;
  readonly occurredAt: string;
}

export class InMemoryApplicationEventPublisher implements ApplicationEventPublisher {
  readonly events: MetadataApplicationEvent[] = [];

  async publish<T extends MetadataApplicationEvent>(event: T): Promise<void> {
    this.events.push(event);
  }
}
