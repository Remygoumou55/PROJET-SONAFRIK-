import type { StreamingPlatform } from "@sonafrik/types";
import type { StreamingDomainEventType } from "../events";
import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import {
  isSessionExpirationActive,
  isSessionHeartbeatActive,
  isSessionRecoveryActive,
} from "../runtime/streaming-runtime-config";
import type { StreamingRuntimeContext } from "../runtime/streaming-runtime-context";
import { RuntimeTransitionRejectedError } from "../runtime-errors";
import type { SessionCommand } from "./session.commands";
import { deriveSessionState } from "./session-state";
import { isTerminalSessionState, transitionSessionState } from "./session-state-machine";
import type { SessionCommandResult } from "./session-engine.types";
import {
  emitSessionEvent,
  requireOpenSession,
  type SessionEngineRuntime,
} from "./session-engine.runtime";

export async function handleAuthenticateSession(
  runtime: SessionEngineRuntime,
  ctx: StreamingRuntimeContext,
  config: StreamingRuntimeConfig,
): Promise<SessionCommandResult> {
  const transition = transitionSessionState("Initial", "AuthValidated");
  if (!transition.allowed || !transition.nextState) {
    throw new RuntimeTransitionRejectedError();
  }

  runtime.authenticatedCorrelations.add(ctx.correlationId);
  const events: StreamingDomainEventType[] = ["SessionAuthenticated"];
  await emitSessionEvent(runtime, ctx, config, "SessionAuthenticated", {}, undefined, undefined);

  return { state: transition.nextState, events };
}

export async function handleCreateSession(
  runtime: SessionEngineRuntime,
  ctx: StreamingRuntimeContext,
  command: Extract<SessionCommand, { type: "CreateSession" }>,
  config: StreamingRuntimeConfig,
): Promise<SessionCommandResult> {
  if (!runtime.authenticatedCorrelations.has(ctx.correlationId)) {
    await handleAuthenticateSession(runtime, ctx, config);
  }

  const transition = transitionSessionState("Authenticated", "OpenSession");
  if (!transition.allowed || !transition.nextState) {
    throw new RuntimeTransitionRejectedError();
  }

  const sessionId = await runtime.repository.openSession({
    actorId: ctx.actorId,
    trackId: command.trackId,
    platform: (command.platform ?? "web") as StreamingPlatform,
    qualityKbps: command.qualityKbps,
    deviceId: command.deviceId,
    totalDurationSeconds: command.totalDurationSeconds,
  });

  runtime.overlays.set(sessionId, { runtimeState: "Created" });
  const events: StreamingDomainEventType[] = ["SessionCreated"];
  await emitSessionEvent(
    runtime,
    ctx,
    config,
    "SessionCreated",
    { sessionId, trackId: command.trackId },
    sessionId,
    command.trackId,
  );

  return { sessionId, state: "Created", events };
}

export async function handleActivateSession(
  runtime: SessionEngineRuntime,
  ctx: StreamingRuntimeContext,
  sessionId: string,
  config: StreamingRuntimeConfig,
): Promise<SessionCommandResult> {
  return handleHeartbeatSession(runtime, ctx, sessionId, 0, config, true);
}

export async function handleHeartbeatSession(
  runtime: SessionEngineRuntime,
  ctx: StreamingRuntimeContext,
  sessionId: string,
  positionSeconds: number,
  config: StreamingRuntimeConfig,
  forceActivate = false,
): Promise<SessionCommandResult> {
  if (!isSessionHeartbeatActive(config) && !forceActivate) {
    throw new RuntimeTransitionRejectedError("Session heartbeat désactivé");
  }

  const session = await requireOpenSession(runtime, sessionId, ctx.actorId);
  const overlay = runtime.overlays.get(sessionId) ?? {};
  const current = deriveSessionState(session, overlay);
  const events: StreamingDomainEventType[] = [];

  if (current === "Created" || forceActivate) {
    const first = transitionSessionState("Created", "FirstHeartbeat");
    if (!first.allowed || !first.nextState) {
      throw new RuntimeTransitionRejectedError("Activation session refusée");
    }
    await runtime.repository.recordHeartbeat(sessionId, ctx.actorId, positionSeconds);
    await runtime.repository.recordStreamEvent(
      sessionId,
      ctx.actorId,
      session.track_id,
      "heartbeat",
      positionSeconds,
    );
    events.push("SessionActivated");
    await emitSessionEvent(
      runtime,
      ctx,
      config,
      "SessionActivated",
      { positionSeconds },
      sessionId,
      session.track_id,
    );
    runtime.overlays.set(sessionId, { runtimeState: "Active" });
    return { sessionId, state: "Active", events };
  }

  if (current === "Suspended") {
    throw new RuntimeTransitionRejectedError("Heartbeat interdit en pause");
  }

  if (isTerminalSessionState(current)) {
    throw new RuntimeTransitionRejectedError(`Heartbeat interdit depuis ${current}`);
  }

  const heartbeatTransition = transitionSessionState(current, "HeartbeatRecorded");
  if (!heartbeatTransition.allowed) {
    throw new RuntimeTransitionRejectedError();
  }

  await runtime.repository.recordHeartbeat(sessionId, ctx.actorId, positionSeconds);
  await runtime.repository.recordStreamEvent(
    sessionId,
    ctx.actorId,
    session.track_id,
    "heartbeat",
    positionSeconds,
  );
  events.push("PlaybackHeartbeat");
  await emitSessionEvent(
    runtime,
    ctx,
    config,
    "PlaybackHeartbeat",
    { positionSeconds },
    sessionId,
    session.track_id,
  );
  runtime.overlays.set(sessionId, { ...overlay, runtimeState: "Heartbeat" });

  return { sessionId, state: "Heartbeat", events };
}

export async function handleSuspendSession(
  runtime: SessionEngineRuntime,
  ctx: StreamingRuntimeContext,
  sessionId: string,
  config: StreamingRuntimeConfig,
): Promise<SessionCommandResult> {
  const session = await requireOpenSession(runtime, sessionId, ctx.actorId);
  const current = deriveSessionState(session, runtime.overlays.get(sessionId));

  const transition = transitionSessionState(current, "PauseRecorded");
  if (!transition.allowed || !transition.nextState) {
    throw new RuntimeTransitionRejectedError();
  }

  await runtime.repository.recordStreamEvent(
    sessionId,
    ctx.actorId,
    session.track_id,
    "pause",
    session.total_listened_seconds,
  );

  const events: StreamingDomainEventType[] = ["SessionSuspended"];
  await emitSessionEvent(runtime, ctx, config, "SessionSuspended", {}, sessionId, session.track_id);
  runtime.overlays.set(sessionId, { suspended: true, runtimeState: "Suspended" });

  return { sessionId, state: "Suspended", events };
}

export async function handleResumeSession(
  runtime: SessionEngineRuntime,
  ctx: StreamingRuntimeContext,
  sessionId: string,
  config: StreamingRuntimeConfig,
): Promise<SessionCommandResult> {
  return recoverFromSuspended(runtime, ctx, sessionId, config, "ResumeSession");
}

export async function handleRecoverSession(
  runtime: SessionEngineRuntime,
  ctx: StreamingRuntimeContext,
  sessionId: string,
  config: StreamingRuntimeConfig,
): Promise<SessionCommandResult> {
  if (!isSessionRecoveryActive(config)) {
    throw new RuntimeTransitionRejectedError("Session recovery désactivé");
  }
  return recoverFromSuspended(runtime, ctx, sessionId, config, "RecoverSession");
}

async function recoverFromSuspended(
  runtime: SessionEngineRuntime,
  ctx: StreamingRuntimeContext,
  sessionId: string,
  config: StreamingRuntimeConfig,
  source: "ResumeSession" | "RecoverSession",
): Promise<SessionCommandResult> {
  const session = await requireOpenSession(runtime, sessionId, ctx.actorId);
  const overlay = runtime.overlays.get(sessionId) ?? {};
  const current = deriveSessionState(session, overlay);

  const transition = transitionSessionState(current, "ResumeRecorded");
  if (!transition.allowed || !transition.nextState) {
    throw new RuntimeTransitionRejectedError();
  }

  await runtime.repository.recordStreamEvent(
    sessionId,
    ctx.actorId,
    session.track_id,
    "resume",
    session.total_listened_seconds,
  );

  const events: StreamingDomainEventType[] =
    source === "RecoverSession"
      ? ["SessionRecovered", "SessionActivated"]
      : ["SessionActivated"];

  if (source === "RecoverSession") {
    await emitSessionEvent(
      runtime,
      ctx,
      config,
      "SessionRecovered",
      { source },
      sessionId,
      session.track_id,
    );
  }
  await emitSessionEvent(
    runtime,
    ctx,
    config,
    "SessionActivated",
    { source },
    sessionId,
    session.track_id,
  );

  runtime.overlays.set(sessionId, { suspended: false, runtimeState: "Active" });
  return { sessionId, state: "Active", events };
}

export async function handleExpireSession(
  runtime: SessionEngineRuntime,
  ctx: StreamingRuntimeContext,
  sessionId: string,
  config: StreamingRuntimeConfig,
): Promise<SessionCommandResult> {
  if (!isSessionExpirationActive(config)) {
    throw new RuntimeTransitionRejectedError("Session expiration désactivé");
  }

  const session = await requireOpenSession(runtime, sessionId, ctx.actorId);
  const current = deriveSessionState(session, runtime.overlays.get(sessionId));

  const trigger = current === "Created" ? "StartTimeout" : "HeartbeatTimeout";
  const transition = transitionSessionState(current, trigger);
  if (!transition.allowed || !transition.nextState) {
    throw new RuntimeTransitionRejectedError();
  }

  const events: StreamingDomainEventType[] = ["SessionExpired"];
  await emitSessionEvent(
    runtime,
    ctx,
    config,
    "SessionExpired",
    { reason: trigger },
    sessionId,
    session.track_id,
  );
  runtime.overlays.set(sessionId, { runtimeState: "Expired" });

  return { sessionId, state: "Expired", events };
}

export async function handleCloseSession(
  runtime: SessionEngineRuntime,
  ctx: StreamingRuntimeContext,
  sessionId: string,
  positionSeconds: number,
  totalDurationSeconds: number,
  config: StreamingRuntimeConfig,
): Promise<SessionCommandResult> {
  const session = await requireOpenSession(runtime, sessionId, ctx.actorId);
  const current = deriveSessionState(session, runtime.overlays.get(sessionId));

  const isValid = await runtime.repository.completeSession({
    sessionId,
    actorId: ctx.actorId,
    positionSeconds,
    totalDurationSeconds,
  });

  const trigger = isValid ? "CompleteValid" : "CompleteInvalid";
  let transition = transitionSessionState(current, trigger);
  if (!transition.allowed && current === "Heartbeat") {
    transition = transitionSessionState("Active", trigger);
  }
  if (!transition.allowed) {
    throw new RuntimeTransitionRejectedError();
  }

  await runtime.repository.recordStreamEvent(
    sessionId,
    ctx.actorId,
    session.track_id,
    "complete",
    positionSeconds,
    { isValidListen: isValid },
  );

  const events: StreamingDomainEventType[] = isValid
    ? ["StreamValidated", "SessionClosed"]
    : ["StreamRejected", "SessionClosed"];

  await emitSessionEvent(
    runtime,
    ctx,
    config,
    isValid ? "StreamValidated" : "StreamRejected",
    { positionSeconds, totalDurationSeconds, isValidListen: isValid },
    sessionId,
    session.track_id,
  );
  await emitSessionEvent(
    runtime,
    ctx,
    config,
    "SessionClosed",
    {
      subtype: isValid ? "Completed_Valid" : "Completed_Invalid",
      isValidListen: isValid,
    },
    sessionId,
    session.track_id,
  );

  runtime.overlays.delete(sessionId);
  return { sessionId, state: "Closed", events, isValidListen: isValid };
}

export async function handleInvalidateSession(
  runtime: SessionEngineRuntime,
  ctx: StreamingRuntimeContext,
  sessionId: string,
  reason: string,
  config: StreamingRuntimeConfig,
): Promise<SessionCommandResult> {
  const session = await requireOpenSession(runtime, sessionId, ctx.actorId);
  const current = deriveSessionState(session, runtime.overlays.get(sessionId));

  if (isTerminalSessionState(current)) {
    throw new RuntimeTransitionRejectedError();
  }

  await runtime.repository.completeSession({
    sessionId,
    actorId: ctx.actorId,
    positionSeconds: 0,
    totalDurationSeconds: session.total_duration_seconds,
  });

  const events: StreamingDomainEventType[] = ["StreamRejected", "SessionClosed"];
  await emitSessionEvent(
    runtime,
    ctx,
    config,
    "StreamRejected",
    { reason },
    sessionId,
    session.track_id,
  );
  await emitSessionEvent(
    runtime,
    ctx,
    config,
    "SessionClosed",
    { subtype: "Invalidated", reason },
    sessionId,
    session.track_id,
  );

  runtime.overlays.delete(sessionId);
  return { sessionId, state: "Closed", events, isValidListen: false };
}
