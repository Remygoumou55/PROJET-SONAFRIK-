import type { StreamingRuntimeConfig } from "../integration/feature-flags";

export type { StreamingRuntimeConfig };

export function isRuntimeActive(config: StreamingRuntimeConfig): boolean {
  return config.runtimeEnabled;
}

export function isApplicationLayerActive(config: StreamingRuntimeConfig): boolean {
  return config.runtimeEnabled && config.applicationLayerEnabled;
}

export function canPublishEvents(config: StreamingRuntimeConfig): boolean {
  return config.runtimeEnabled && config.eventsEnabled;
}

export function canUsePorts(config: StreamingRuntimeConfig): boolean {
  return config.runtimeEnabled && config.portsEnabled;
}

export function requiresLegacyPath(config: StreamingRuntimeConfig): boolean {
  return !config.runtimeEnabled || config.dryRun;
}

export function isSessionEngineActive(config: StreamingRuntimeConfig): boolean {
  return (
    config.runtimeEnabled &&
    config.applicationLayerEnabled &&
    config.portsEnabled &&
    config.sessionEngineEnabled
  );
}

export function isSessionHeartbeatActive(config: StreamingRuntimeConfig): boolean {
  return isSessionEngineActive(config) && config.sessionHeartbeatEnabled;
}

export function isSessionRecoveryActive(config: StreamingRuntimeConfig): boolean {
  return isSessionEngineActive(config) && config.sessionRecoveryEnabled;
}

export function isSessionExpirationActive(config: StreamingRuntimeConfig): boolean {
  return isSessionEngineActive(config) && config.sessionExpirationEnabled;
}

export function isPlaybackEngineActive(config: StreamingRuntimeConfig): boolean {
  return (
    config.runtimeEnabled &&
    config.applicationLayerEnabled &&
    config.portsEnabled &&
    config.playbackEngineEnabled
  );
}

export function isPlaybackSignedUrlActive(config: StreamingRuntimeConfig): boolean {
  return isPlaybackEngineActive(config) && config.playbackSignedUrlEnabled;
}

export function isPlaybackBufferActive(config: StreamingRuntimeConfig): boolean {
  return isPlaybackEngineActive(config) && config.playbackBufferEnabled;
}

export function isPlaybackRecoveryActive(config: StreamingRuntimeConfig): boolean {
  return isPlaybackEngineActive(config) && config.playbackRecoveryEnabled;
}

export function isPlaybackQualityActive(config: StreamingRuntimeConfig): boolean {
  return isPlaybackEngineActive(config) && config.playbackQualityEnabled;
}
