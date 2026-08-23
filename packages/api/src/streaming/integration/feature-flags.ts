import { AdminConfigRepository } from "../../shared/admin-config.repository";
import type { SonafrikSupabaseClient } from "@sonafrik/database";

/** Sprint 2.1 — Streaming Runtime Foundation feature flags */
export const STREAMING_RUNTIME_FEATURE_FLAGS = {
  RUNTIME_ENABLED: "streaming_runtime_enabled",
  APPLICATION_LAYER: "runtime_application_layer_enabled",
  CONTRACTS: "runtime_contracts_enabled",
  PORTS: "runtime_ports_enabled",
  EVENTS: "runtime_events_enabled",
  CONTEXT: "runtime_context_enabled",
  SESSION_ENGINE: "streaming_session_engine_enabled",
  SESSION_HEARTBEAT: "streaming_session_heartbeat_enabled",
  SESSION_RECOVERY: "streaming_session_recovery_enabled",
  SESSION_EXPIRATION: "streaming_session_expiration_enabled",
  PLAYBACK_ENGINE: "streaming_playback_engine_enabled",
  PLAYBACK_BUFFER: "streaming_playback_buffer_enabled",
  PLAYBACK_RECOVERY: "streaming_playback_recovery_enabled",
  PLAYBACK_QUALITY: "streaming_playback_quality_enabled",
  PLAYBACK_SIGNED_URL: "streaming_playback_signed_url_enabled",
} as const;

export type StreamingRuntimeFeatureFlagName =
  (typeof STREAMING_RUNTIME_FEATURE_FLAGS)[keyof typeof STREAMING_RUNTIME_FEATURE_FLAGS];

export interface StreamingRuntimeFeatureFlagState {
  readonly runtimeEnabled: boolean;
  readonly applicationLayerEnabled: boolean;
  readonly contractsEnabled: boolean;
  readonly portsEnabled: boolean;
  readonly eventsEnabled: boolean;
  readonly contextEnabled: boolean;
  readonly sessionEngineEnabled: boolean;
  readonly sessionHeartbeatEnabled: boolean;
  readonly sessionRecoveryEnabled: boolean;
  readonly sessionExpirationEnabled: boolean;
  readonly playbackEngineEnabled: boolean;
  readonly playbackBufferEnabled: boolean;
  readonly playbackRecoveryEnabled: boolean;
  readonly playbackQualityEnabled: boolean;
  readonly playbackSignedUrlEnabled: boolean;
}

export const DEFAULT_STREAMING_RUNTIME_FLAGS: StreamingRuntimeFeatureFlagState = {
  runtimeEnabled: false,
  applicationLayerEnabled: false,
  contractsEnabled: false,
  portsEnabled: false,
  eventsEnabled: false,
  contextEnabled: false,
  sessionEngineEnabled: false,
  sessionHeartbeatEnabled: false,
  sessionRecoveryEnabled: false,
  sessionExpirationEnabled: false,
  playbackEngineEnabled: false,
  playbackBufferEnabled: false,
  playbackRecoveryEnabled: false,
  playbackQualityEnabled: false,
  playbackSignedUrlEnabled: false,
};

export class StreamingRuntimeFeatureFlagResolver {
  private readonly config: AdminConfigRepository;

  constructor(client: SonafrikSupabaseClient) {
    this.config = new AdminConfigRepository(client);
  }

  async resolve(): Promise<StreamingRuntimeFeatureFlagState> {
    const [
      runtimeEnabled,
      applicationLayerEnabled,
      contractsEnabled,
      portsEnabled,
      eventsEnabled,
      contextEnabled,
      sessionEngineEnabled,
      sessionHeartbeatEnabled,
      sessionRecoveryEnabled,
      sessionExpirationEnabled,
      playbackEngineEnabled,
      playbackBufferEnabled,
      playbackRecoveryEnabled,
      playbackQualityEnabled,
      playbackSignedUrlEnabled,
    ] = await Promise.all([
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.RUNTIME_ENABLED),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.APPLICATION_LAYER),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.CONTRACTS),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.PORTS),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.EVENTS),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.CONTEXT),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.SESSION_ENGINE),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.SESSION_HEARTBEAT),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.SESSION_RECOVERY),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.SESSION_EXPIRATION),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.PLAYBACK_ENGINE),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.PLAYBACK_BUFFER),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.PLAYBACK_RECOVERY),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.PLAYBACK_QUALITY),
      this.config.isFeatureEnabled(STREAMING_RUNTIME_FEATURE_FLAGS.PLAYBACK_SIGNED_URL),
    ]);

    return {
      runtimeEnabled,
      applicationLayerEnabled,
      contractsEnabled,
      portsEnabled,
      eventsEnabled,
      contextEnabled,
      sessionEngineEnabled,
      sessionHeartbeatEnabled,
      sessionRecoveryEnabled,
      sessionExpirationEnabled,
      playbackEngineEnabled,
      playbackBufferEnabled,
      playbackRecoveryEnabled,
      playbackQualityEnabled,
      playbackSignedUrlEnabled,
    };
  }
}

export interface StreamingRuntimeConfig {
  readonly runtimeEnabled: boolean;
  readonly applicationLayerEnabled: boolean;
  readonly contractsEnabled: boolean;
  readonly portsEnabled: boolean;
  readonly eventsEnabled: boolean;
  readonly contextEnabled: boolean;
  readonly sessionEngineEnabled: boolean;
  readonly sessionHeartbeatEnabled: boolean;
  readonly sessionRecoveryEnabled: boolean;
  readonly sessionExpirationEnabled: boolean;
  readonly playbackEngineEnabled: boolean;
  readonly playbackBufferEnabled: boolean;
  readonly playbackRecoveryEnabled: boolean;
  readonly playbackQualityEnabled: boolean;
  readonly playbackSignedUrlEnabled: boolean;
  readonly dryRun: boolean;
}

export function buildRuntimeConfig(
  flags: StreamingRuntimeFeatureFlagState,
): StreamingRuntimeConfig {
  return {
    runtimeEnabled: flags.runtimeEnabled,
    applicationLayerEnabled: flags.applicationLayerEnabled,
    contractsEnabled: flags.contractsEnabled,
    portsEnabled: flags.portsEnabled,
    eventsEnabled: flags.eventsEnabled,
    contextEnabled: flags.contextEnabled,
    sessionEngineEnabled: flags.sessionEngineEnabled,
    sessionHeartbeatEnabled: flags.sessionHeartbeatEnabled,
    sessionRecoveryEnabled: flags.sessionRecoveryEnabled,
    sessionExpirationEnabled: flags.sessionExpirationEnabled,
    playbackEngineEnabled: flags.playbackEngineEnabled,
    playbackBufferEnabled: flags.playbackBufferEnabled,
    playbackRecoveryEnabled: flags.playbackRecoveryEnabled,
    playbackQualityEnabled: flags.playbackQualityEnabled,
    playbackSignedUrlEnabled: flags.playbackSignedUrlEnabled,
    dryRun: !flags.runtimeEnabled,
  };
}
