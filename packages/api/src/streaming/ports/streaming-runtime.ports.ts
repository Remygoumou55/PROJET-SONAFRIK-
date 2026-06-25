import type {
  DomainEventBusContract,
  LegacyStreamingAdapterContract,
  SessionRepositoryContract,
  StreamEventRepositoryContract,
} from "../contracts";
import type {
  PlaybackPositionRepositoryContract,
  SignedUrlRepositoryContract,
} from "../contracts/playback.contract";
import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import type { SessionCommand } from "../session/session.commands";
import type { SessionCommandResult } from "../session/session-engine";
import type { PlaybackCommand } from "../playback/playback.commands";
import type { PlaybackCommandResult } from "../playback/playback-engine";

/** Session Engine port — Sprint 2.2 */
export interface SessionEnginePort {
  readonly engineId: "session-engine";
  isReady(config: StreamingRuntimeConfig): boolean;
  execute(
    ctx: import("../runtime/streaming-runtime-context").StreamingRuntimeContext,
    command: SessionCommand,
    config: StreamingRuntimeConfig,
  ): Promise<SessionCommandResult>;
}

/** Playback Engine port — Sprint 2.3 */
export interface PlaybackEnginePort {
  readonly engineId: "playback-engine";
  isReady(config: StreamingRuntimeConfig): boolean;
  execute(
    ctx: import("../runtime/streaming-runtime-context").StreamingRuntimeContext,
    command: PlaybackCommand,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult>;
}

/** Analytics Engine port — implémentation Sprint 2.4 */
export interface AnalyticsEnginePort {
  readonly engineId: "analytics-engine";
  isReady(config: StreamingRuntimeConfig): boolean;
}

/** Anti-Fraud Engine port — implémentation Sprint 2.5 */
export interface AntiFraudEnginePort {
  readonly engineId: "antifraud-engine";
  isReady(config: StreamingRuntimeConfig): boolean;
}

/** Stream Ledger port — implémentation Sprint 2.6 */
export interface StreamLedgerPort {
  readonly engineId: "stream-ledger";
  isReady(config: StreamingRuntimeConfig): boolean;
}

export interface StreamingRuntimePorts {
  readonly sessionEngine: SessionEnginePort;
  readonly playbackEngine: PlaybackEnginePort;
  readonly analyticsEngine: AnalyticsEnginePort;
  readonly antiFraudEngine: AntiFraudEnginePort;
  readonly streamLedger: StreamLedgerPort;
  readonly sessionRepository: SessionRepositoryContract;
  readonly streamEventRepository: StreamEventRepositoryContract;
  readonly signedUrlRepository: SignedUrlRepositoryContract;
  readonly playbackPositionRepository: PlaybackPositionRepositoryContract;
  readonly eventBus: DomainEventBusContract;
  readonly legacyAdapter: LegacyStreamingAdapterContract;
}
