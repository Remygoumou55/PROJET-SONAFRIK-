import type { SessionStateId, StreamingPlatform } from "@sonafrik/types";
import type { StreamingDomainEventType } from "../events";
import type { DomainEventBusContract, SessionRepositoryContract } from "../contracts";
import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import {
  canPublishEvents,
  isSessionEngineActive,
  isSessionExpirationActive,
  isSessionHeartbeatActive,
  isSessionRecoveryActive,
} from "../runtime/streaming-runtime-config";
import type { StreamingRuntimeContext } from "../runtime/streaming-runtime-context";
import {
  RuntimeNotAuthorizedError,
  RuntimeTransitionRejectedError,
} from "../runtime-errors";
import type { SessionCommand } from "./session.commands";
import { publishSessionDomainEvent } from "./session-event-publisher";
import {
  deriveClosedSubtype,
  deriveSessionState,
  isFirstHeartbeat,
  type SessionRuntimeOverlay,
} from "./session-state";
import { isTerminalSessionState, transitionSessionState } from "./session-state-machine";
import type { SessionEnginePort } from "../ports";

export interface SessionCommandResult {
  readonly sessionId?: string;
  readonly state: SessionStateId;
  readonly events: readonly StreamingDomainEventType[];
  readonly isValidListen?: boolean;
}

export class SessionEngine implements SessionEnginePort {
  readonly engineId = "session-engine" as const;

  private readonly authenticatedCorrelations = new Set<string>();
  private readonly overlays = new Map<string, SessionRuntimeOverlay>();

  constructor(
    private readonly repository: SessionRepositoryContract,
    private readonly eventBus: DomainEventBusContract,
  ) {}

  isReady(config: StreamingRuntimeConfig): boolean {
    return isSessionEngineActive(config);
  }

  async execute(
    ctx: StreamingRuntimeContext,
    command: SessionCommand,
    config: StreamingRuntimeConfig,
  ): Promise<SessionCommandResult> {
    if (!this.isReady(config)) {
      throw new RuntimeTransitionRejectedError("Session Engine désactivé");
    }

    switch (command.type) {
      case "AuthenticateSession":
        return this.authenticate(ctx, config);
      case "CreateSession":
        return this.createSession(ctx, command, config);
      case "ActivateSession":
        return this.activateSession(ctx, command.sessionId, config);
      case "HeartbeatSession":
        return this.heartbeat(ctx, command.sessionId, command.positionSeconds, config);
      case "SuspendSession":
        return this.suspend(ctx, command.sessionId, config);
      case "ResumeSession":
        return this.resume(ctx, command.sessionId, config);
      case "RecoverSession":
        return this.recover(ctx, command.sessionId, config);
      case "ExpireSession":
        return this.expire(ctx, command.sessionId, config);
      case "CloseSession":
      case "CompleteSession":
        return this.close(
          ctx,
          command.sessionId,
          command.positionSeconds,
          command.totalDurationSeconds,
          config,
        );
      case "InvalidateSession":
        return this.invalidate(ctx, command.sessionId, command.reason, config);
      default: {
        const _exhaustive: never = command;
        return _exhaustive;
      }
    }
  }

  getDerivedState(
    sessionId: string,
    session: Awaited<ReturnType<SessionRepositoryContract["findById"]>>,
    nowMs?: number,
  ): SessionStateId {
    if (!session) return "Closed";
    return deriveSessionState(session, this.overlays.get(sessionId), nowMs);
  }

  private async authenticate(
    ctx: StreamingRuntimeContext,
    config: StreamingRuntimeConfig,
  ): Promise<SessionCommandResult> {
    const transition = transitionSessionState("Initial", "AuthValidated");
    if (!transition.allowed || !transition.nextState) {
      throw new RuntimeTransitionRejectedError();
    }

    this.authenticatedCorrelations.add(ctx.correlationId);
    const events: StreamingDomainEventType[] = ["SessionAuthenticated"];
    await this.emit(ctx, config, "SessionAuthenticated", {}, undefined, undefined, events);

    return { state: transition.nextState, events };
  }

  private async createSession(
    ctx: StreamingRuntimeContext,
    command: Extract<SessionCommand, { type: "CreateSession" }>,
    config: StreamingRuntimeConfig,
  ): Promise<SessionCommandResult> {
    if (!this.authenticatedCorrelations.has(ctx.correlationId)) {
      await this.authenticate(ctx, config);
    }

    const transition = transitionSessionState("Authenticated", "OpenSession");
    if (!transition.allowed || !transition.nextState) {
      throw new RuntimeTransitionRejectedError();
    }

    const sessionId = await this.repository.openSession({
      actorId: ctx.actorId,
      trackId: command.trackId,
      platform: (command.platform ?? "web") as StreamingPlatform,
      qualityKbps: command.qualityKbps,
      deviceId: command.deviceId,
      totalDurationSeconds: command.totalDurationSeconds,
    });

    this.overlays.set(sessionId, { runtimeState: "Created" });
    const events: StreamingDomainEventType[] = ["SessionCreated"];
    await this.emit(
      ctx,
      config,
      "SessionCreated",
      { sessionId, trackId: command.trackId },
      sessionId,
      command.trackId,
      events,
    );

    return { sessionId, state: "Created", events };
  }

  private async activateSession(
    ctx: StreamingRuntimeContext,
    sessionId: string,
    config: StreamingRuntimeConfig,
  ): Promise<SessionCommandResult> {
    return this.heartbeat(ctx, sessionId, 0, config, true);
  }

  private async heartbeat(
    ctx: StreamingRuntimeContext,
    sessionId: string,
    positionSeconds: number,
    config: StreamingRuntimeConfig,
    forceActivate = false,
  ): Promise<SessionCommandResult> {
    if (!isSessionHeartbeatActive(config) && !forceActivate) {
      throw new RuntimeTransitionRejectedError("Session heartbeat désactivé");
    }

    const session = await this.requireSession(sessionId, ctx.actorId);
    const overlay = this.overlays.get(sessionId) ?? {};
    const current = deriveSessionState(session, overlay);
    const events: StreamingDomainEventType[] = [];

    if (current === "Created" || forceActivate) {
      const first = transitionSessionState("Created", "FirstHeartbeat");
      if (!first.allowed || !first.nextState) {
        throw new RuntimeTransitionRejectedError("Activation session refusée");
      }
      await this.repository.recordHeartbeat(sessionId, ctx.actorId, positionSeconds);
      await this.repository.recordStreamEvent(
        sessionId,
        ctx.actorId,
        session.track_id,
        "heartbeat",
        positionSeconds,
      );
      events.push("SessionActivated");
      await this.emit(
        ctx,
        config,
        "SessionActivated",
        { positionSeconds },
        sessionId,
        session.track_id,
        events,
      );
      this.overlays.set(sessionId, { runtimeState: "Active" });
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

    await this.repository.recordHeartbeat(sessionId, ctx.actorId, positionSeconds);
    await this.repository.recordStreamEvent(
      sessionId,
      ctx.actorId,
      session.track_id,
      "heartbeat",
      positionSeconds,
    );
    events.push("PlaybackHeartbeat");
    await this.emit(
      ctx,
      config,
      "PlaybackHeartbeat",
      { positionSeconds },
      sessionId,
      session.track_id,
      events,
    );
    this.overlays.set(sessionId, { ...overlay, runtimeState: "Heartbeat" });

    return { sessionId, state: "Heartbeat", events };
  }

  private async suspend(
    ctx: StreamingRuntimeContext,
    sessionId: string,
    config: StreamingRuntimeConfig,
  ): Promise<SessionCommandResult> {
    const session = await this.requireSession(sessionId, ctx.actorId);
    const current = deriveSessionState(session, this.overlays.get(sessionId));

    const transition = transitionSessionState(current, "PauseRecorded");
    if (!transition.allowed || !transition.nextState) {
      throw new RuntimeTransitionRejectedError();
    }

    await this.repository.recordStreamEvent(
      sessionId,
      ctx.actorId,
      session.track_id,
      "pause",
      session.total_listened_seconds,
    );

    const events: StreamingDomainEventType[] = ["SessionSuspended"];
    await this.emit(ctx, config, "SessionSuspended", {}, sessionId, session.track_id, events);
    this.overlays.set(sessionId, { suspended: true, runtimeState: "Suspended" });

    return { sessionId, state: "Suspended", events };
  }

  private async resume(
    ctx: StreamingRuntimeContext,
    sessionId: string,
    config: StreamingRuntimeConfig,
  ): Promise<SessionCommandResult> {
    return this.recoverFromSuspended(ctx, sessionId, config, "ResumeSession");
  }

  private async recover(
    ctx: StreamingRuntimeContext,
    sessionId: string,
    config: StreamingRuntimeConfig,
  ): Promise<SessionCommandResult> {
    if (!isSessionRecoveryActive(config)) {
      throw new RuntimeTransitionRejectedError("Session recovery désactivé");
    }
    return this.recoverFromSuspended(ctx, sessionId, config, "RecoverSession");
  }

  private async recoverFromSuspended(
    ctx: StreamingRuntimeContext,
    sessionId: string,
    config: StreamingRuntimeConfig,
    source: "ResumeSession" | "RecoverSession",
  ): Promise<SessionCommandResult> {
    const session = await this.requireSession(sessionId, ctx.actorId);
    const overlay = this.overlays.get(sessionId) ?? {};
    const current = deriveSessionState(session, overlay);

    const transition = transitionSessionState(current, "ResumeRecorded");
    if (!transition.allowed || !transition.nextState) {
      throw new RuntimeTransitionRejectedError();
    }

    await this.repository.recordStreamEvent(
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
      await this.emit(ctx, config, "SessionRecovered", { source }, sessionId, session.track_id, events);
    }
    await this.emit(ctx, config, "SessionActivated", { source }, sessionId, session.track_id, events);

    this.overlays.set(sessionId, { suspended: false, runtimeState: "Active" });
    return { sessionId, state: "Active", events };
  }

  private async expire(
    ctx: StreamingRuntimeContext,
    sessionId: string,
    config: StreamingRuntimeConfig,
  ): Promise<SessionCommandResult> {
    if (!isSessionExpirationActive(config)) {
      throw new RuntimeTransitionRejectedError("Session expiration désactivé");
    }

    const session = await this.requireSession(sessionId, ctx.actorId);
    const current = deriveSessionState(session, this.overlays.get(sessionId));

    const trigger = current === "Created" ? "StartTimeout" : "HeartbeatTimeout";
    const transition = transitionSessionState(current, trigger);
    if (!transition.allowed || !transition.nextState) {
      throw new RuntimeTransitionRejectedError();
    }

    const events: StreamingDomainEventType[] = ["SessionExpired"];
    await this.emit(
      ctx,
      config,
      "SessionExpired",
      { reason: trigger },
      sessionId,
      session.track_id,
      events,
    );
    this.overlays.set(sessionId, { runtimeState: "Expired" });

    return { sessionId, state: "Expired", events };
  }

  private async close(
    ctx: StreamingRuntimeContext,
    sessionId: string,
    positionSeconds: number,
    totalDurationSeconds: number,
    config: StreamingRuntimeConfig,
  ): Promise<SessionCommandResult> {
    const session = await this.requireSession(sessionId, ctx.actorId);
    const current = deriveSessionState(session, this.overlays.get(sessionId));

    const isValid = await this.repository.completeSession({
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

    await this.repository.recordStreamEvent(
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

    await this.emit(
      ctx,
      config,
      isValid ? "StreamValidated" : "StreamRejected",
      { positionSeconds, totalDurationSeconds, isValidListen: isValid },
      sessionId,
      session.track_id,
      events,
    );
    await this.emit(
      ctx,
      config,
      "SessionClosed",
      {
        subtype: isValid ? "Completed_Valid" : "Completed_Invalid",
        isValidListen: isValid,
      },
      sessionId,
      session.track_id,
      events,
    );

    this.overlays.delete(sessionId);
    return { sessionId, state: "Closed", events, isValidListen: isValid };
  }

  private async invalidate(
    ctx: StreamingRuntimeContext,
    sessionId: string,
    reason: string,
    config: StreamingRuntimeConfig,
  ): Promise<SessionCommandResult> {
    const session = await this.requireSession(sessionId, ctx.actorId);
    const current = deriveSessionState(session, this.overlays.get(sessionId));

    if (isTerminalSessionState(current)) {
      throw new RuntimeTransitionRejectedError();
    }

    await this.repository.completeSession({
      sessionId,
      actorId: ctx.actorId,
      positionSeconds: 0,
      totalDurationSeconds: session.total_duration_seconds,
    });

    const events: StreamingDomainEventType[] = ["StreamRejected", "SessionClosed"];
    await this.emit(
      ctx,
      config,
      "StreamRejected",
      { reason },
      sessionId,
      session.track_id,
      events,
    );
    await this.emit(
      ctx,
      config,
      "SessionClosed",
      { subtype: "Invalidated", reason },
      sessionId,
      session.track_id,
      events,
    );

    this.overlays.delete(sessionId);
    return { sessionId, state: "Closed", events, isValidListen: false };
  }

  private async requireSession(sessionId: string, actorId: string) {
    const session = await this.repository.findById(sessionId, actorId);
    if (!session) {
      throw new RuntimeNotAuthorizedError("Session introuvable");
    }
    if (session.completed_at) {
      throw new RuntimeTransitionRejectedError("Session déjà fermée");
    }
    return session;
  }

  private async emit(
    ctx: StreamingRuntimeContext,
    config: StreamingRuntimeConfig,
    eventType: StreamingDomainEventType,
    payload: Record<string, unknown>,
    sessionId: string | undefined,
    trackId: string | undefined,
    _events: StreamingDomainEventType[],
  ): Promise<void> {
    if (!canPublishEvents(config)) return;
    await publishSessionDomainEvent(
      this.eventBus,
      ctx,
      eventType,
      payload,
      sessionId,
      trackId,
    );
  }
}

export function createSessionEngine(
  repository: SessionRepositoryContract,
  eventBus: DomainEventBusContract,
): SessionEngine {
  return new SessionEngine(repository, eventBus);
}

/** Test helper — expose closed subtype derivation */
export function resolveClosedSubtype(
  session: Parameters<typeof deriveClosedSubtype>[0],
): ReturnType<typeof deriveClosedSubtype> {
  return deriveClosedSubtype(session);
}

export function sessionIsFirstHeartbeat(
  session: Parameters<typeof isFirstHeartbeat>[0],
): boolean {
  return isFirstHeartbeat(session);
}
