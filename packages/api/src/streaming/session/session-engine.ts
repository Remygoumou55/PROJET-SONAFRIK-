import type { SessionStateId } from "@sonafrik/types";
import type { DomainEventBusContract, SessionRepositoryContract } from "../contracts";
import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import { isSessionEngineActive } from "../runtime/streaming-runtime-config";
import type { StreamingRuntimeContext } from "../runtime/streaming-runtime-context";
import { RuntimeTransitionRejectedError } from "../runtime-errors";
import type { SessionCommand } from "./session.commands";
import { deriveClosedSubtype, deriveSessionState, isFirstHeartbeat, type SessionRuntimeOverlay } from "./session-state";
import type { SessionEnginePort } from "../ports";
import type { SessionCommandResult } from "./session-engine.types";
import type { SessionEngineRuntime } from "./session-engine.runtime";
import {
  handleActivateSession,
  handleAuthenticateSession,
  handleCloseSession,
  handleCreateSession,
  handleExpireSession,
  handleHeartbeatSession,
  handleInvalidateSession,
  handleRecoverSession,
  handleResumeSession,
  handleSuspendSession,
} from "./session-engine.handlers";

export type { SessionCommandResult } from "./session-engine.types";

export class SessionEngine implements SessionEnginePort {
  readonly engineId = "session-engine" as const;

  private readonly runtime: SessionEngineRuntime;

  constructor(
    repository: SessionRepositoryContract,
    eventBus: DomainEventBusContract,
  ) {
    this.runtime = {
      repository,
      eventBus,
      authenticatedCorrelations: new Set<string>(),
      overlays: new Map<string, SessionRuntimeOverlay>(),
    };
  }

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

    const rt = this.runtime;

    switch (command.type) {
      case "AuthenticateSession":
        return handleAuthenticateSession(rt, ctx, config);
      case "CreateSession":
        return handleCreateSession(rt, ctx, command, config);
      case "ActivateSession":
        return handleActivateSession(rt, ctx, command.sessionId, config);
      case "HeartbeatSession":
        return handleHeartbeatSession(rt, ctx, command.sessionId, command.positionSeconds, config);
      case "SuspendSession":
        return handleSuspendSession(rt, ctx, command.sessionId, config);
      case "ResumeSession":
        return handleResumeSession(rt, ctx, command.sessionId, config);
      case "RecoverSession":
        return handleRecoverSession(rt, ctx, command.sessionId, config);
      case "ExpireSession":
        return handleExpireSession(rt, ctx, command.sessionId, config);
      case "CloseSession":
      case "CompleteSession":
        return handleCloseSession(
          rt,
          ctx,
          command.sessionId,
          command.positionSeconds,
          command.totalDurationSeconds,
          config,
        );
      case "InvalidateSession":
        return handleInvalidateSession(rt, ctx, command.sessionId, command.reason, config);
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
    return deriveSessionState(session, this.runtime.overlays.get(sessionId), nowMs);
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
