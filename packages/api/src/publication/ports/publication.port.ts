import type { MetadataApplicationService } from "../../metadata/application/services";
import type { PreparePublicationRequestDto } from "../dto";

export type PublicationEventType =
  | "PublicationRequested"
  | "PublicationValidated"
  | "PublicationPrepared"
  | "PublicationCancelled"
  | "PublicationReady";

export interface PublicationEvent {
  readonly type: PublicationEventType;
  readonly actorId: string;
  readonly correlationId: string;
  readonly metadataId?: string;
  readonly trackId?: string;
  readonly reason?: string;
  readonly occurredAt: string;
}

export interface PublicationEventPublisher {
  publish<T extends PublicationEvent>(event: T): Promise<void>;
}

export class InMemoryPublicationEventPublisher implements PublicationEventPublisher {
  readonly events: PublicationEvent[] = [];

  async publish<T extends PublicationEvent>(event: T): Promise<void> {
    this.events.push(event);
  }
}

/** Port — orchestrator depends on MetadataApplicationService abstraction */
export interface PublicationOrchestratorPorts {
  readonly metadataService: MetadataApplicationService;
}

export interface IdempotencyStore {
  has(key: string): boolean;
  set(key: string, request: PreparePublicationRequestDto): void;
  get(key: string): PreparePublicationRequestDto | undefined;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly store = new Map<string, PreparePublicationRequestDto>();

  has(key: string): boolean {
    return this.store.has(key);
  }

  set(key: string, request: PreparePublicationRequestDto): void {
    this.store.set(key, request);
  }

  get(key: string): PreparePublicationRequestDto | undefined {
    return this.store.get(key);
  }
}
