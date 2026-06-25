import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  DomainEventBusContract,
  LegacyStreamingAdapterContract,
  SessionRepositoryContract,
  StreamEventRepositoryContract,
} from "../contracts";
import type { StreamingDomainEventEnvelope } from "../events";
import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import type {
  AnalyticsEnginePort,
  AntiFraudEnginePort,
  DomainEventPublisherPort,
  StreamLedgerPort,
  StreamingRuntimePorts,
} from "../ports";
import { InMemoryDomainEventPublisher, NoOpLegacyStreamingPort } from "../ports";
import type {
  PlaybackPositionRepositoryContract,
  SignedUrlRepositoryContract,
} from "../contracts/playback.contract";
import { InMemorySessionRepository } from "../session/in-memory-session.repository";
import { createSessionEngine } from "../session/session-engine";
import { registerSessionPipelineHandlers } from "../session/session-pipeline-handlers";
import { SupabaseSessionRepository } from "../session/supabase-session.repository";
import {
  InMemoryPlaybackPositionRepository,
  InMemorySignedUrlRepository,
} from "../playback/in-memory-playback.repository";
import { createPlaybackEngine } from "../playback/playback-engine";
import { registerPlaybackPipelineHandlers } from "../playback/playback-pipeline-handlers";
import { StreamingRuntimeCoordinator } from "./streaming-runtime-coordinator";
import {
  createEmptyPipelineRegistry,
  type RuntimePipelineRegistry,
} from "./pipeline";
import type { StreamingRuntimeDependencies } from "./streaming-runtime-dependencies";

function createStubEngine<T extends { engineId: string }>(
  engineId: T["engineId"],
): { engineId: T["engineId"]; isReady: (config: StreamingRuntimeConfig) => boolean } {
  return {
    engineId,
    isReady: (config) => config.runtimeEnabled && config.portsEnabled,
  };
}

class InMemoryStreamEventRepository implements StreamEventRepositoryContract {
  async append(): Promise<void> {
    /* no-op foundation */
  }
}

class FoundationLegacyAdapter implements LegacyStreamingAdapterContract {
  readonly name = "legacy-streaming-service" as const;

  isActive(): boolean {
    return true;
  }
}

class InMemoryEventBus implements DomainEventBusContract {
  private readonly inner = new InMemoryDomainEventPublisher();

  async publish<TPayload>(event: StreamingDomainEventEnvelope<TPayload>): Promise<void> {
    await this.inner.publish(event);
  }
}

export interface CreateRuntimePortsOptions {
  readonly sessionRepository?: SessionRepositoryContract;
  readonly signedUrlRepository?: SignedUrlRepositoryContract;
  readonly playbackPositionRepository?: PlaybackPositionRepositoryContract;
}

export function createFoundationRuntimePorts(
  options: CreateRuntimePortsOptions = {},
): StreamingRuntimePorts {
  const eventBus = new InMemoryEventBus();
  const sessionRepository = options.sessionRepository ?? new InMemorySessionRepository();
  const signedUrlRepository =
    options.signedUrlRepository ?? new InMemorySignedUrlRepository(sessionRepository);
  const playbackPositionRepository =
    options.playbackPositionRepository ?? new InMemoryPlaybackPositionRepository();
  const sessionEngine = createSessionEngine(sessionRepository, eventBus);
  const playbackEngine = createPlaybackEngine(
    signedUrlRepository,
    playbackPositionRepository,
    eventBus,
    sessionEngine,
  );

  return {
    sessionEngine,
    playbackEngine,
    analyticsEngine: createStubEngine("analytics-engine") as AnalyticsEnginePort,
    antiFraudEngine: createStubEngine("antifraud-engine") as AntiFraudEnginePort,
    streamLedger: createStubEngine("stream-ledger") as StreamLedgerPort,
    sessionRepository,
    streamEventRepository: new InMemoryStreamEventRepository(),
    signedUrlRepository,
    playbackPositionRepository,
    eventBus,
    legacyAdapter: new FoundationLegacyAdapter(),
  };
}

export function createSupabaseRuntimePorts(client: SonafrikSupabaseClient): StreamingRuntimePorts {
  const sessionRepository = new SupabaseSessionRepository(client);
  return createFoundationRuntimePorts({ sessionRepository });
}

export interface StreamingRuntimeFactoryOptions {
  readonly config: StreamingRuntimeConfig;
  readonly ports?: StreamingRuntimePorts;
  readonly events?: DomainEventPublisherPort;
  readonly pipeline?: RuntimePipelineRegistry;
  readonly registerSessionHandlers?: boolean;
  readonly registerPlaybackHandlers?: boolean;
}

function shouldRegisterHandlers(
  options: StreamingRuntimeFactoryOptions,
  kind: "session" | "playback",
): boolean {
  const flag =
    kind === "session" ? options.registerSessionHandlers : options.registerPlaybackHandlers;
  if (flag === true) return true;
  if (flag === false) return false;
  return options.pipeline === undefined;
}

export function createStreamingRuntimeCoordinator(
  options: StreamingRuntimeFactoryOptions,
): StreamingRuntimeCoordinator {
  const ports = options.ports ?? createFoundationRuntimePorts();
  const events = options.events ?? new InMemoryDomainEventPublisher();
  const pipeline = options.pipeline ?? createEmptyPipelineRegistry();

  if (shouldRegisterHandlers(options, "session") && ports.sessionEngine) {
    registerSessionPipelineHandlers(
      pipeline,
      ports.sessionEngine as import("../session/session-engine").SessionEngine,
    );
  }

  if (shouldRegisterHandlers(options, "playback") && ports.playbackEngine) {
    registerPlaybackPipelineHandlers(
      pipeline,
      ports.playbackEngine as import("../playback/playback-engine").PlaybackEngine,
    );
  }

  return new StreamingRuntimeCoordinator(ports, events, pipeline, options.config);
}

export function createStreamingRuntimeDependencies(
  options: StreamingRuntimeFactoryOptions,
): StreamingRuntimeDependencies {
  const ports = options.ports ?? createFoundationRuntimePorts();
  const events = options.events ?? new InMemoryDomainEventPublisher();
  const pipeline = createEmptyPipelineRegistry();

  if (shouldRegisterHandlers(options, "session") && ports.sessionEngine) {
    registerSessionPipelineHandlers(
      pipeline,
      ports.sessionEngine as import("../session/session-engine").SessionEngine,
    );
  }

  if (shouldRegisterHandlers(options, "playback") && ports.playbackEngine) {
    registerPlaybackPipelineHandlers(
      pipeline,
      ports.playbackEngine as import("../playback/playback-engine").PlaybackEngine,
    );
  }

  return {
    ports,
    events,
    pipeline,
    config: options.config,
  };
}

export function createStreamingRuntimeBundle(options: StreamingRuntimeFactoryOptions): {
  coordinator: StreamingRuntimeCoordinator;
  dependencies: StreamingRuntimeDependencies;
  legacyPort: NoOpLegacyStreamingPort;
} {
  const legacyPort = new NoOpLegacyStreamingPort();
  const coordinator = createStreamingRuntimeCoordinator(options);
  const dependencies = createStreamingRuntimeDependencies({
    ...options,
    registerSessionHandlers: false,
    registerPlaybackHandlers: false,
  });

  return { coordinator, dependencies, legacyPort };
}
