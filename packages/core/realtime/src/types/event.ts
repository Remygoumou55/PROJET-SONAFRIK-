import type { z } from "zod";
import type { SrtspConnectionState, SrtspTransportKind } from "./transport";

/** Domaine métier source d'un événement SRTSP. */
export type SrtspEventSource =
  | "catalog"
  | "publication"
  | "creator"
  | "listener"
  | "wallet"
  | "streaming"
  | "notifications"
  | "admin"
  | "identity"
  | "social"
  | "system";

/** Module destination — abonnés potentiels. */
export type SrtspEventDestination =
  | "dashboard"
  | "catalog"
  | "publications"
  | "library"
  | "wallet"
  | "analytics"
  | "notifications"
  | "streaming"
  | "admin"
  | "*";

/** Catégorie événement — contrat Enterprise v1.1. */
export type SrtspEventType = "domain" | "control" | "transport" | "heartbeat";

export interface SrtspEventMetadata {
  correlationId?: string;
  causationId?: string;
  emittedBy?: string;
  channel?: string;
  [key: string]: unknown;
}

/** Enveloppe officielle — typée, versionnée, traçable (contrat v1.1). */
export interface SrtspEvent<TPayload = Record<string, unknown>> {
  id: string;
  name: string;
  type: SrtspEventType;
  version: number;
  payload: TPayload;
  source: SrtspEventSource;
  destinations: SrtspEventDestination[];
  timestamp: number;
  metadata?: SrtspEventMetadata;
  dedupeKey?: string;
  actor?: {
    userId?: string;
    role?: string;
  };
}

export type SrtspEventListener<TPayload = Record<string, unknown>> = (
  event: SrtspEvent<TPayload>,
) => void;

export interface SrtspEventDefinition<TSchema extends z.ZodType = z.ZodType> {
  name: string;
  type: SrtspEventType;
  version: number;
  source: SrtspEventSource;
  destinations: SrtspEventDestination[];
  schema: TSchema;
  description: string;
}

export type SrtspPublishInput<TPayload = Record<string, unknown>> = {
  name: string;
  payload: TPayload;
  source: SrtspEventSource;
  type?: SrtspEventType;
  destinations?: SrtspEventDestination[];
  metadata?: SrtspEventMetadata;
  dedupeKey?: string;
  actor?: SrtspEvent["actor"];
  version?: number;
};

export interface SrtspBusStats {
  subscriptions: number;
  eventsPublished: number;
  eventsDelivered: number;
  eventsDropped: number;
  eventsRejected: number;
  eventsByName: Record<string, number>;
}

export interface SrtspMonitorSnapshot {
  bus: SrtspBusStats;
  queue: { pending: number; processing: number; failed: number; retries: number };
  deduplication: { tracked: number; dropped: number };
  offline: { buffered: number; flushed: number };
  transport: { kind: SrtspTransportKind; connected: boolean; state: SrtspConnectionState; reconnectAttempts: number };
  latency: { lastPropagationMs: number; avgPropagationMs: number; samples: number };
  subscriptions: { active: number };
  errors: { count: number; lastMessage?: string; journalSize: number };
}

/** API métriques interne — sans UI graphique. */
export interface SrtspMetrics {
  events: {
    published: number;
    received: number;
    rejected: number;
    dropped: number;
    delivered: number;
  };
  latency: SrtspMonitorSnapshot["latency"];
  retries: number;
  subscriptions: { active: number };
  transport: SrtspTransportStats;
  errors: { count: number; recent: SrtspJournalEntry[] };
}

export interface SrtspTransportStats {
  kind: SrtspTransportKind;
  connected: boolean;
  state: SrtspConnectionState;
  reconnectAttempts: number;
  messagesReceived: number;
}

export interface SrtspJournalEntry {
  at: number;
  level: "error" | "warn";
  code: string;
  message: string;
  context?: Record<string, unknown>;
}
