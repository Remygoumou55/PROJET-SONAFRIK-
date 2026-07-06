import type {
  SupabasePostgresChangePayload,
  SupabaseRealtimeChannelLike,
  SupabaseRealtimeClientLike,
} from "../transport/supabase-types";

/** Harness mock Supabase — réutilisé par les suites E2E / transport. */
export interface MockSupabaseHarness {
  client: SupabaseRealtimeClientLike;
  emitChange: (payload: SupabasePostgresChangePayload) => void;
  simulateSubscribeStatus: (status: string, err?: Error) => void;
  readonly channelRemoved: boolean;
}

export function createMockSupabaseHarness(): MockSupabaseHarness {
  const handlers: Array<{
    config: { event: string; schema: string; table: string; filter?: string };
    callback: (payload: SupabasePostgresChangePayload) => void;
  }> = [];
  let subscribeCallback: ((status: string, err?: Error) => void) | undefined;
  let removed = false;

  const channel: SupabaseRealtimeChannelLike = {
    on(_type, config, callback) {
      handlers.push({ config, callback });
      return channel;
    },
    subscribe(cb) {
      subscribeCallback = cb;
      cb?.("SUBSCRIBED");
      return channel;
    },
  };

  const client: SupabaseRealtimeClientLike = {
    channel: () => channel,
    removeChannel: async () => {
      removed = true;
    },
  };

  return {
    client,
    emitChange(payload) {
      for (const h of handlers) {
        if (h.config.table === payload.table && h.config.event === payload.eventType) {
          h.callback(payload);
        }
      }
    },
    simulateSubscribeStatus(status, err) {
      subscribeCallback?.(status, err);
    },
    get channelRemoved() {
      return removed;
    },
  };
}
