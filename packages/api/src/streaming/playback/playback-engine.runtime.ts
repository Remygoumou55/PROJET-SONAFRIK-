import type { StreamingDomainEventType } from "../events";
import type {
  PlaybackPositionRepositoryContract,
  SignedUrlRepositoryContract,
} from "../contracts/playback.contract";
import type { DomainEventBusContract } from "../contracts";
import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import {
  canPublishEvents,
  isSessionEngineActive,
} from "../runtime/streaming-runtime-config";
import type { StreamingRuntimeContext } from "../runtime/streaming-runtime-context";
import type { SessionEnginePort } from "../ports";
import { RuntimeTransitionRejectedError } from "../runtime-errors";
import { publishPlaybackDomainEvent } from "./playback-event-publisher";
import { derivePlaybackState } from "./playback-state";
import { transitionPlaybackState } from "./playback-state-machine";
import type { PlaybackCommandResult, PlaybackInstance } from "./playback-engine.types";

export interface PlaybackEngineRuntime {
  readonly signedUrls: SignedUrlRepositoryContract;
  readonly positions: PlaybackPositionRepositoryContract;
  readonly eventBus: DomainEventBusContract;
  readonly sessionEngine: SessionEnginePort;
  readonly instances: Map<string, PlaybackInstance>;
}

export function getPlaybackInstance(
  runtime: PlaybackEngineRuntime,
  correlationId: string,
): PlaybackInstance {
  let inst = runtime.instances.get(correlationId);
  if (!inst) {
    inst = { state: "Idle", overlay: {} };
    runtime.instances.set(correlationId, inst);
  }
  return inst;
}

export async function transitionPlayback(
  runtime: PlaybackEngineRuntime,
  inst: PlaybackInstance,
  ctx: StreamingRuntimeContext,
  trigger: Parameters<typeof transitionPlaybackState>[1],
  config: StreamingRuntimeConfig,
  events: StreamingDomainEventType[],
): Promise<PlaybackCommandResult> {
  const current = derivePlaybackState(inst.state, inst.overlay);
  const result = transitionPlaybackState(current, trigger);
  if (!result.allowed || !result.nextState) {
    throw new RuntimeTransitionRejectedError(`Transition ${trigger} refusée depuis ${current}`);
  }
  inst.state = result.nextState;
  if (result.nextState === "Buffering") {
    inst.overlay = { ...inst.overlay, bufferingStartedAtMs: Date.now() };
  }
  return {
    state: inst.state,
    events,
    sessionId: inst.overlay.sessionId,
    signedUrl: inst.overlay.signedUrl,
    signedUrlExpiresAt: inst.overlay.signedUrlExpiresAt,
    positionSeconds: inst.overlay.positionSeconds,
  };
}

export async function emitPlaybackEvent(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  config: StreamingRuntimeConfig,
  eventType: StreamingDomainEventType,
  payload: Record<string, unknown>,
  sessionId?: string,
  trackId?: string,
): Promise<void> {
  if (!canPublishEvents(config)) return;
  await publishPlaybackDomainEvent(runtime.eventBus, ctx, eventType, payload, sessionId, trackId);
}

export async function applyPlaybackTrigger(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  trigger: Parameters<typeof transitionPlaybackState>[1],
  config: StreamingRuntimeConfig,
  events: StreamingDomainEventType[],
  payload: Record<string, unknown> = {},
): Promise<PlaybackCommandResult> {
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  if (events.length > 0 && events[0]) {
    await emitPlaybackEvent(
      runtime,
      ctx,
      config,
      events[0],
      payload,
      inst.overlay.sessionId,
      inst.overlay.trackId,
    );
  }
  return transitionPlayback(runtime, inst, ctx, trigger, config, events);
}

export async function delegateSessionActivate(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  config: StreamingRuntimeConfig,
  sessionId?: string,
): Promise<void> {
  if (!isSessionEngineActive(config) || !sessionId) return;
  await runtime.sessionEngine.execute(ctx, { type: "ActivateSession", sessionId }, config);
}

export async function delegateSessionSuspend(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  config: StreamingRuntimeConfig,
  sessionId?: string,
): Promise<void> {
  if (!isSessionEngineActive(config) || !sessionId) return;
  await runtime.sessionEngine.execute(ctx, { type: "SuspendSession", sessionId }, config);
}

export async function delegateSessionResume(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  config: StreamingRuntimeConfig,
  sessionId?: string,
): Promise<void> {
  if (!isSessionEngineActive(config) || !sessionId) return;
  await runtime.sessionEngine.execute(ctx, { type: "ResumeSession", sessionId }, config);
}

export async function delegateSessionClose(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  config: StreamingRuntimeConfig,
  sessionId: string | undefined,
  positionSeconds: number,
  totalDurationSeconds: number,
): Promise<void> {
  if (!isSessionEngineActive(config) || !sessionId) return;
  await runtime.sessionEngine.execute(
    ctx,
    { type: "CloseSession", sessionId, positionSeconds, totalDurationSeconds },
    config,
  );
}
