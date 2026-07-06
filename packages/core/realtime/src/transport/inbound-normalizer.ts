import { SRTSP_DOMAIN_EVENTS } from "../registry/domain-events";
import type { SrtspEventSource, SrtspPublishInput } from "../types";
import type { PostgresChangeEvent, SrtspTransportInboundMessage } from "./supabase-types";

const TRACK_EVENT_MAP: Record<Exclude<PostgresChangeEvent, "*">, string> = {
  INSERT: SRTSP_DOMAIN_EVENTS.TRACK_CREATED,
  UPDATE: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
  DELETE: SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function mapTracksInbound(msg: SrtspTransportInboundMessage): SrtspPublishInput | null {
  if (msg.eventType === "*" || !(msg.eventType in TRACK_EVENT_MAP)) return null;
  const name = TRACK_EVENT_MAP[msg.eventType as Exclude<PostgresChangeEvent, "*">];
  const record = msg.record;
  const trackId = typeof record.id === "string" ? record.id : undefined;
  const creatorId = typeof record.creator_id === "string" ? record.creator_id : undefined;
  if (!trackId) return null;

  return {
    name,
    source: "catalog" satisfies SrtspEventSource,
    payload: { trackId, ...(creatorId ? { creatorId } : {}) },
    dedupeKey: `supabase:tracks:${msg.eventType}:${trackId}:${msg.commitTimestamp ?? "na"}`,
    metadata: { channel: "supabase", table: msg.table, transportEvent: msg.eventType },
    type: "domain",
  };
}

function mapNotificationsInbound(msg: SrtspTransportInboundMessage): SrtspPublishInput | null {
  if (msg.eventType !== "INSERT") return null;
  const record = msg.record;
  const notificationId = typeof record.id === "string" ? record.id : undefined;
  const userId = typeof record.user_id === "string" ? record.user_id : undefined;
  if (!notificationId || !userId) return null;

  return {
    name: SRTSP_DOMAIN_EVENTS.NOTIFICATION_CREATED,
    source: "notifications",
    payload: { notificationId, userId },
    dedupeKey: `supabase:notifications:INSERT:${notificationId}:${msg.commitTimestamp ?? "na"}`,
    metadata: { channel: "supabase", table: msg.table },
    type: "domain",
  };
}

function mapTrackReactionsInbound(msg: SrtspTransportInboundMessage): SrtspPublishInput | null {
  if (msg.eventType === "DELETE") return null;
  const record = msg.record;
  const trackId = typeof record.track_id === "string" ? record.track_id : undefined;
  const emoji = typeof record.emoji === "string" ? record.emoji : undefined;
  if (!trackId) return null;

  return {
    name: SRTSP_DOMAIN_EVENTS.TRACK_REACTION_UPDATED,
    source: "listener",
    payload: {
      trackId,
      emoji,
      count: typeof record.count === "number" ? record.count : undefined,
    },
    dedupeKey: `supabase:track_reaction_counts:${msg.eventType}:${trackId}:${emoji ?? "all"}:${msg.commitTimestamp ?? "na"}`,
    metadata: { channel: "supabase", table: msg.table, transportEvent: msg.eventType },
    type: "domain",
  };
}

function mapStreamSessionsInbound(msg: SrtspTransportInboundMessage): SrtspPublishInput | null {
  const record = msg.record;
  const trackId = typeof record.track_id === "string" ? record.track_id : undefined;
  if (!trackId) return null;

  return {
    name: SRTSP_DOMAIN_EVENTS.LISTENER_LIVE_UPDATED,
    source: "streaming",
    payload: { trackId, sessionId: typeof record.id === "string" ? record.id : undefined },
    dedupeKey: `supabase:stream_sessions:${msg.eventType}:${trackId}:${msg.commitTimestamp ?? "na"}`,
    metadata: { channel: "supabase", table: msg.table, transportEvent: msg.eventType },
    type: "domain",
  };
}

function mapAdminSnapshotInbound(
  msg: SrtspTransportInboundMessage,
): SrtspPublishInput | null {
  return {
    name: SRTSP_DOMAIN_EVENTS.ADMIN_SNAPSHOT_INVALIDATE,
    source: "admin",
    payload: { table: msg.table, eventType: msg.eventType },
    dedupeKey: `supabase:admin:${msg.table}:${msg.eventType}:${msg.commitTimestamp ?? "na"}`,
    metadata: { channel: "supabase", table: msg.table, transportEvent: msg.eventType },
    type: "domain",
  };
}

const ADMIN_SNAPSHOT_TABLES = new Set([
  "profiles",
  "artist_profiles",
  "creators",
  "withdrawals",
  "rights_claims",
  "creator_verifications",
  "wallet_ledger",
  "albums",
  "audit_logs",
  "award_nominees",
]);

/** SSOT — postgres_changes → contrat SRTSP publish input. */
export function normalizeSupabaseInbound(raw: unknown): SrtspPublishInput | null {
  if (!raw || typeof raw !== "object") return null;
  const msg = raw as SrtspTransportInboundMessage;
  if (msg.transport !== "supabase") return null;

  switch (msg.table) {
    case "tracks":
      return mapTracksInbound(msg);
    case "notifications":
      return mapNotificationsInbound(msg);
    case "track_reaction_counts":
      return mapTrackReactionsInbound(msg);
    case "stream_sessions":
      return mapStreamSessionsInbound(msg);
    default:
      if (ADMIN_SNAPSHOT_TABLES.has(msg.table)) {
        return mapAdminSnapshotInbound(msg);
      }
      return null;
  }
}

export function toTransportInboundMessage(
  payload: {
    schema: string;
    table: string;
    commit_timestamp?: string;
    eventType: PostgresChangeEvent;
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  },
): SrtspTransportInboundMessage {
  const record =
    payload.eventType === "DELETE"
      ? asRecord(payload.old) ?? {}
      : asRecord(payload.new) ?? {};

  return {
    transport: "supabase",
    table: payload.table,
    eventType: payload.eventType,
    commitTimestamp: payload.commit_timestamp,
    record,
    previousRecord: payload.eventType === "UPDATE" ? asRecord(payload.old) ?? undefined : undefined,
  };
}
