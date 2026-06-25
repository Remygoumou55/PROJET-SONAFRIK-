import type { StreamingDomainEventEnvelope } from "../events";
import type { StreamSession, StreamingPlatform } from "@sonafrik/types";

/** Contract — domain event bus (outbox adapter in future sprints) */
export interface DomainEventBusContract {
  publish<TPayload>(event: StreamingDomainEventEnvelope<TPayload>): Promise<void>;
}

export interface RepositoryReadOptions {
  readonly limit?: number;
}

export interface OpenSessionParams {
  readonly actorId: string;
  readonly trackId: string;
  readonly platform: StreamingPlatform;
  readonly qualityKbps?: number | null;
  readonly deviceId?: string | null;
  readonly totalDurationSeconds?: number;
}

export interface CompleteSessionParams {
  readonly sessionId: string;
  readonly actorId: string;
  readonly positionSeconds: number;
  readonly totalDurationSeconds: number;
}

/** Contract — session persistence (Session Engine 2.2) */
export interface SessionRepositoryContract {
  findById(sessionId: string, actorId: string): Promise<StreamSession | null>;
  openSession(params: OpenSessionParams): Promise<string>;
  recordHeartbeat(sessionId: string, actorId: string, positionSeconds: number): Promise<void>;
  completeSession(params: CompleteSessionParams): Promise<boolean>;
  recordStreamEvent(
    sessionId: string,
    actorId: string,
    trackId: string,
    eventType: "play" | "pause" | "resume" | "heartbeat" | "complete" | "skip",
    positionSeconds: number,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
}

/** @deprecated Use StreamSession from @sonafrik/types */
export interface SessionRecord {
  readonly sessionId: string;
  readonly userId: string;
  readonly trackId: string;
  readonly status: string;
}

/** Contract — stream events append-only */
export interface StreamEventRepositoryContract {
  append(event: StreamingDomainEventEnvelope): Promise<void>;
}

/** Contract — transport adapters (edge / direct RPC) */
export interface EdgeTransportAdapterContract {
  readonly name: string;
  isAvailable(): Promise<boolean>;
}

export interface LegacyStreamingAdapterContract {
  readonly name: "legacy-streaming-service";
  isActive(): boolean;
}
