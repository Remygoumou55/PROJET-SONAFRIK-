import type { StreamingDomainEventEnvelope } from "../events";

export interface DomainEventPublisherPort {
  publish<TPayload>(event: StreamingDomainEventEnvelope<TPayload>): Promise<void>;
}

export class InMemoryDomainEventPublisher implements DomainEventPublisherPort {
  readonly published: StreamingDomainEventEnvelope[] = [];

  async publish<TPayload>(event: StreamingDomainEventEnvelope<TPayload>): Promise<void> {
    this.published.push(event as StreamingDomainEventEnvelope);
  }
}

export interface LegacyStreamingPort {
  readonly mode: "legacy";
  delegateToLegacy(): { readonly active: true };
}

export class NoOpLegacyStreamingPort implements LegacyStreamingPort {
  readonly mode = "legacy" as const;

  delegateToLegacy(): { readonly active: true } {
    return { active: true };
  }
}
