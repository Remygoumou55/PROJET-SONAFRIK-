import type { StreamSession } from "@sonafrik/types";
import type {
  CompleteSessionParams,
  OpenSessionParams,
  SessionRepositoryContract,
} from "../contracts";

/** In-memory session repository for tests and foundation dry-run */
export class InMemorySessionRepository implements SessionRepositoryContract {
  private readonly sessions = new Map<string, StreamSession>();

  async findById(sessionId: string, actorId: string): Promise<StreamSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.user_id !== actorId) return null;
    return { ...session };
  }

  async openSession(params: OpenSessionParams): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.sessions.set(id, {
      id,
      user_id: params.actorId,
      track_id: params.trackId,
      track_file_id: null,
      device_id: params.deviceId ?? null,
      platform: params.platform,
      quality_kbps: params.qualityKbps ?? null,
      started_at: now,
      last_heartbeat_at: now,
      completed_at: null,
      total_listened_seconds: 0,
      total_duration_seconds: params.totalDurationSeconds ?? 180,
      listen_percentage: 0,
      is_valid_listen: false,
      fraud_flags: [],
      ip_address: null,
      user_agent: null,
      created_at: now,
      updated_at: now,
    });
    return id;
  }

  async recordHeartbeat(
    sessionId: string,
    actorId: string,
    positionSeconds: number,
  ): Promise<void> {
    const session = await this.findById(sessionId, actorId);
    if (!session) throw new Error("Session introuvable");
    const now = new Date().toISOString();
    this.sessions.set(sessionId, {
      ...session,
      last_heartbeat_at: now,
      total_listened_seconds: Math.max(session.total_listened_seconds, positionSeconds),
      listen_percentage:
        session.total_duration_seconds > 0
          ? (Math.max(session.total_listened_seconds, positionSeconds) /
              session.total_duration_seconds) *
            100
          : 0,
      updated_at: now,
    });
  }

  async completeSession(params: CompleteSessionParams): Promise<boolean> {
    const session = await this.findById(params.sessionId, params.actorId);
    if (!session) throw new Error("Session introuvable");
    const listened = Math.max(session.total_listened_seconds, params.positionSeconds);
    const pct =
      params.totalDurationSeconds > 0 ? (listened / params.totalDurationSeconds) * 100 : 0;
    const isValid = pct >= 90;
    const now = new Date().toISOString();
    this.sessions.set(params.sessionId, {
      ...session,
      completed_at: now,
      total_listened_seconds: listened,
      total_duration_seconds: params.totalDurationSeconds,
      listen_percentage: pct,
      is_valid_listen: isValid,
      updated_at: now,
    });
    return isValid;
  }

  async recordStreamEvent(): Promise<void> {
    /* no-op in memory */
  }
}
