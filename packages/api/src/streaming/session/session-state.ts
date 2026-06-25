import type {
  SessionClosedSubtype,
  SessionStateId,
  StreamSession,
} from "@sonafrik/types";

/** Mirror @sonafrik/types — STATE_MACHINE.md §7 */
const SESSION_ORPHAN_TIMEOUT_MS = 5 * 60 * 1000;
const SESSION_START_TIMEOUT_MS = 30_000;

export interface SessionRuntimeOverlay {
  readonly suspended?: boolean;
  readonly runtimeState?: SessionStateId;
}

export function deriveClosedSubtype(session: StreamSession): SessionClosedSubtype {
  if (session.is_valid_listen) return "Completed_Valid";
  if (session.fraud_flags.length > 0) return "Invalidated";
  if (session.listen_percentage <= 0) return "Skipped";
  return "Completed_Invalid";
}

export function deriveSessionState(
  session: StreamSession,
  overlay: SessionRuntimeOverlay = {},
  nowMs: number = Date.now(),
): SessionStateId {
  if (overlay.runtimeState === "Authenticated") {
    return "Authenticated";
  }

  if (session.completed_at) {
    return "Closed";
  }

  if (session.fraud_flags.includes("orphaned_session")) {
    return "Expired";
  }

  const lastHeartbeatMs = new Date(session.last_heartbeat_at).getTime();
  const startedMs = new Date(session.started_at).getTime();

  if (nowMs - lastHeartbeatMs > SESSION_ORPHAN_TIMEOUT_MS) {
    return "Expired";
  }

  if (session.fraud_flags.length > 0) {
    return "FraudReview";
  }

  if (overlay.suspended || overlay.runtimeState === "Suspended") {
    return "Suspended";
  }

  if (overlay.runtimeState === "Heartbeat") {
    return "Heartbeat";
  }

  if (overlay.runtimeState === "Active") {
    return "Active";
  }

  if (overlay.runtimeState === "Created") {
    return "Created";
  }

  if (session.total_listened_seconds <= 0 && nowMs - startedMs >= SESSION_START_TIMEOUT_MS) {
    return "Expired";
  }

  if (session.total_listened_seconds <= 0 && nowMs - startedMs < SESSION_START_TIMEOUT_MS) {
    return "Created";
  }

  if (session.total_listened_seconds > 0) {
    return "Active";
  }

  return "Created";
}

export function isFirstHeartbeat(session: StreamSession): boolean {
  return session.total_listened_seconds <= 0;
}
