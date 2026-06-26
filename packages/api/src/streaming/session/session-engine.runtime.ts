import type { StreamingDomainEventType } from "../events";
import type { DomainEventBusContract, SessionRepositoryContract } from "../contracts";
import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import { canPublishEvents } from "../runtime/streaming-runtime-config";
import type { StreamingRuntimeContext } from "../runtime/streaming-runtime-context";
import {
  RuntimeNotAuthorizedError,
  RuntimeTransitionRejectedError,
} from "../runtime-errors";
import { publishSessionDomainEvent } from "./session-event-publisher";
import type { SessionRuntimeOverlay } from "./session-state";

export interface SessionEngineRuntime {
  readonly repository: SessionRepositoryContract;
  readonly eventBus: DomainEventBusContract;
  readonly authenticatedCorrelations: Set<string>;
  readonly overlays: Map<string, SessionRuntimeOverlay>;
}

export async function requireOpenSession(
  runtime: SessionEngineRuntime,
  sessionId: string,
  actorId: string,
) {
  const session = await runtime.repository.findById(sessionId, actorId);
  if (!session) {
    throw new RuntimeNotAuthorizedError("Session introuvable");
  }
  if (session.completed_at) {
    throw new RuntimeTransitionRejectedError("Session déjà fermée");
  }
  return session;
}

export async function emitSessionEvent(
  runtime: SessionEngineRuntime,
  ctx: StreamingRuntimeContext,
  config: StreamingRuntimeConfig,
  eventType: StreamingDomainEventType,
  payload: Record<string, unknown>,
  sessionId: string | undefined,
  trackId: string | undefined,
): Promise<void> {
  if (!canPublishEvents(config)) return;
  await publishSessionDomainEvent(runtime.eventBus, ctx, eventType, payload, sessionId, trackId);
}
