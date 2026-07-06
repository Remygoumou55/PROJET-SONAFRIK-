import type { SrtspTransportAdapter } from "../types";
import { toTransportInboundMessage } from "./inbound-normalizer";
import { DEFAULT_SRTSP_SUPABASE_SUBSCRIPTIONS } from "./supabase-config";
import type {
  SupabasePostgresSubscription,
  SupabaseRealtimeChannelLike,
  SupabaseRealtimeClientLike,
  SupabaseTransportOptions,
} from "./supabase-types";

/** Implémentation Realtime Supabase — Phase 2.1 certifiée. */
export function createSupabaseTransport(options: SupabaseTransportOptions): SrtspTransportAdapter {
  const {
    client,
    channelPrefix = "srtsp",
    subscriptions = DEFAULT_SRTSP_SUPABASE_SUBSCRIPTIONS,
    disabled = false,
  } = options;

  let connected = false;
  let channel: SupabaseRealtimeChannelLike | null = null;
  const handlers = new Set<(raw: unknown) => void>();

  const emit = (raw: unknown) => {
    for (const handler of handlers) handler(raw);
  };

  return {
    kind: "supabase",
    connect() {
      if (disabled) {
        connected = false;
        return;
      }
      if (connected && channel) return;

      const channelName = `${channelPrefix}_${Date.now()}`;
      let ch = client.channel(channelName);

      for (const sub of subscriptions) {
        ch = wireSubscription(ch, client, sub, emit);
      }

      ch.subscribe((status, err) => {
        if (status === "SUBSCRIBED") connected = true;
        if (err || status === "CHANNEL_ERROR" || status === "TIMED_OUT") connected = false;
      });

      channel = ch;
    },
    async disconnect() {
      connected = false;
      if (channel) {
        await client.removeChannel(channel);
        channel = null;
      }
    },
    isConnected: () => connected,
    onMessage(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
}

function wireSubscription(
  ch: SupabaseRealtimeChannelLike,
  _client: SupabaseRealtimeClientLike,
  sub: SupabasePostgresSubscription,
  emit: (raw: unknown) => void,
): SupabaseRealtimeChannelLike {
  const events = sub.events ?? ["INSERT", "UPDATE", "DELETE"];
  const schema = sub.schema ?? "public";
  let next = ch;

  for (const event of events) {
    next = next.on(
      "postgres_changes",
      {
        event,
        schema,
        table: sub.table,
        ...(sub.filter ? { filter: sub.filter } : {}),
      },
      (payload) => {
        const inbound = toTransportInboundMessage({
          schema: payload.schema,
          table: payload.table,
          commit_timestamp: payload.commit_timestamp,
          eventType: payload.eventType,
          new: payload.new ?? {},
          old: payload.old ?? {},
        });
        emit(inbound);
      },
    );
  }

  return next;
}

/** @deprecated Utiliser createSupabaseTransport — conservé tests legacy. */
export function createSupabaseTransportStub(): SrtspTransportAdapter {
  return {
    kind: "supabase",
    connect() {},
    disconnect() {},
    isConnected: () => false,
    onMessage: () => () => {},
  };
}
