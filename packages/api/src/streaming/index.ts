/** Streaming Runtime Foundation — legacy exports preserved */
export { StreamingError } from "./errors";
export { mapFunctionInvokeError } from "./invoke-errors";
export type { StreamingErrorCode } from "./invoke-errors";
export { StreamingService, createStreamingService } from "./streaming.service";
export { StreamingRepository } from "./streaming.repository";
export type {
  StartStreamInput,
  StreamHeartbeatInput,
  CompleteStreamInput,
  CreatePlaylistInput,
  UpdatePlaylistInput,
  AddTrackToPlaylistInput,
  ToggleFavoriteInput,
  SavePositionInput,
  SearchInput,
  AnalyticsInput,
} from "./schemas";

/** Sprint 2.1 — Runtime Foundation */
export * from "./application";
export * from "./runtime";
export * from "./integration";
export * from "./events";
export * from "./contracts";
export * from "./ports";
export {
  StreamingRuntimeError,
  RuntimeDisabledError,
  ApplicationLayerDisabledError,
  RuntimeContextInvalidError,
  RuntimeNotAuthorizedError,
  RuntimeTransitionRejectedError,
  RuntimeHandlerNotRegisteredError,
  RuntimeNotImplementedError,
} from "./runtime-errors";
export type { StreamingRuntimeErrorCode } from "./runtime-errors";

/** Sprint 2.2 — Session Engine exports */
export * from "./session/session.commands";
export {
  SessionEngine,
  createSessionEngine,
  type SessionCommandResult,
} from "./session/session-engine";
export {
  transitionSessionState,
  isTerminalSessionState,
  allSessionTransitionTriggers,
} from "./session/session-state-machine";
export { deriveSessionState, deriveClosedSubtype } from "./session/session-state";
export { SupabaseSessionRepository } from "./session/supabase-session.repository";
export { InMemorySessionRepository } from "./session/in-memory-session.repository";
export {
  createSessionPipelineHandlers,
  registerSessionPipelineHandlers,
} from "./session/session-pipeline-handlers";

/** Sprint 2.3 — Playback Runtime Engine exports */
export * from "./playback/playback.commands";
export {
  PlaybackEngine,
  createPlaybackEngine,
  type PlaybackCommandResult,
} from "./playback/playback-engine";
export {
  transitionPlaybackState,
  allPlaybackTransitionTriggers,
  canStartPlaybackFrom,
} from "./playback/playback-state-machine";
export { derivePlaybackState, resolveQualityKbps } from "./playback/playback-state";
export { SignedUrlCache } from "./playback/signed-url-cache";
export {
  InMemorySignedUrlRepository,
  InMemoryPlaybackPositionRepository,
} from "./playback/in-memory-playback.repository";
export {
  createPlaybackPipelineHandlers,
  registerPlaybackPipelineHandlers,
} from "./playback/playback-pipeline-handlers";

import type { SonafrikSupabaseClient } from "@sonafrik/database";
import {
  buildRuntimeConfig,
  StreamingRuntimeFeatureFlagResolver,
  DEFAULT_STREAMING_RUNTIME_FLAGS,
} from "./integration";
import { createStreamingApplicationService } from "./application";
import {
  createStreamingRuntimeCoordinator,
  createSupabaseRuntimePorts,
} from "./runtime";

/** Factory — wiring foundation without touching legacy StreamingService */
export async function createStreamingRuntimeFoundation(client: SonafrikSupabaseClient) {
  const resolver = new StreamingRuntimeFeatureFlagResolver(client);
  const flags = await resolver.resolve().catch(() => DEFAULT_STREAMING_RUNTIME_FLAGS);
  const config = buildRuntimeConfig(flags);
  const ports = createSupabaseRuntimePorts(client);
  const coordinator = createStreamingRuntimeCoordinator({ config, ports });
  const application = createStreamingApplicationService({
    coordinator,
    config,
    sessionRepository: ports.sessionRepository,
  });

  return {
    config,
    flags,
    coordinator,
    application,
    ports,
  };
}
