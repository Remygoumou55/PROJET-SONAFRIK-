import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { StreamSession } from "@sonafrik/types";
import type {
  CompleteSessionParams,
  OpenSessionParams,
  SessionRepositoryContract,
} from "../contracts";
import { StreamingRepository } from "../streaming.repository";
import { RuntimeNotAuthorizedError } from "../runtime-errors";

/** Supabase adapter — wraps legacy StreamingRepository RPCs (no direct UI/Supabase in engine) */
export class SupabaseSessionRepository implements SessionRepositoryContract {
  private readonly legacy: StreamingRepository;

  constructor(client: SonafrikSupabaseClient) {
    this.legacy = new StreamingRepository(client);
  }

  async findById(sessionId: string, actorId: string): Promise<StreamSession | null> {
    const session = await this.legacy.getSession(sessionId);
    if (!session) return null;
    assertOwnership(session, actorId);
    return session;
  }

  async openSession(params: OpenSessionParams): Promise<string> {
    return this.legacy.startSession(
      params.actorId,
      params.trackId,
      params.platform,
      params.qualityKbps,
      params.deviceId,
      params.totalDurationSeconds,
    );
  }

  async recordHeartbeat(
    sessionId: string,
    actorId: string,
    positionSeconds: number,
  ): Promise<void> {
    const session = await this.findById(sessionId, actorId);
    if (!session) {
      throw new RuntimeNotAuthorizedError("Session introuvable");
    }
    await this.legacy.heartbeat(sessionId, positionSeconds);
  }

  async completeSession(params: CompleteSessionParams): Promise<boolean> {
    const session = await this.findById(params.sessionId, params.actorId);
    if (!session) {
      throw new RuntimeNotAuthorizedError("Session introuvable");
    }
    return this.legacy.completeSession(
      params.sessionId,
      params.positionSeconds,
      params.totalDurationSeconds,
    );
  }

  async recordStreamEvent(
    sessionId: string,
    actorId: string,
    trackId: string,
    eventType: "play" | "pause" | "resume" | "heartbeat" | "complete" | "skip",
    positionSeconds: number,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.legacy.recordEvent(
      sessionId,
      actorId,
      trackId,
      eventType,
      positionSeconds,
      metadata,
    );
  }
}

function assertOwnership(session: StreamSession, actorId: string): void {
  if (session.user_id !== actorId) {
    throw new RuntimeNotAuthorizedError("Session non autorisée");
  }
}
