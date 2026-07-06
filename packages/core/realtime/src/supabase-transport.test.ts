import { beforeEach, describe, expect, it } from "vitest";
import { resetEventRegistryForTests } from "../src/registry/event-registry";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import {
  SynchronizationEngine,
  resetSynchronizationEngineForTests,
} from "../src/engine/synchronization-engine";
import {
  createSupabaseTransport,
  normalizeSupabaseInbound,
  toTransportInboundMessage,
} from "../src/transport/adapters";
import { TransportManager } from "../src/transport/transport-manager";
import type {
  SupabasePostgresChangePayload,
  SupabaseRealtimeChannelLike,
  SupabaseRealtimeClientLike,
} from "../src/transport/supabase-types";

const TRACK_ID = "550e8400-e29b-41d4-a716-446655440000";
const CREATOR_ID = "660e8400-e29b-41d4-a716-446655440001";

interface MockSupabaseHarness {
  client: SupabaseRealtimeClientLike;
  emitChange: (payload: SupabasePostgresChangePayload) => void;
  simulateSubscribeStatus: (status: string, err?: Error) => void;
}

function createMockSupabaseHarness(): MockSupabaseHarness {
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
    get removed() {
      return removed;
    },
  } as MockSupabaseHarness & { removed: boolean };
}

describe("Supabase inbound normalizer", () => {
  it("mappe tracks INSERT → TRACK_CREATED", () => {
    const raw = toTransportInboundMessage({
      schema: "public",
      table: "tracks",
      eventType: "INSERT",
      commit_timestamp: "2026-07-05T00:00:00Z",
      new: { id: TRACK_ID, creator_id: CREATOR_ID },
      old: {},
    });
    const input = normalizeSupabaseInbound(raw);
    expect(input?.name).toBe(SRTSP_DOMAIN_EVENTS.TRACK_CREATED);
    expect(input?.payload.trackId).toBe(TRACK_ID);
  });

  it("mappe notifications INSERT → NOTIFICATION_CREATED", () => {
    const raw = toTransportInboundMessage({
      schema: "public",
      table: "notifications",
      eventType: "INSERT",
      commit_timestamp: "2026-07-05T00:00:01Z",
      new: { id: "n1", user_id: CREATOR_ID },
      old: {},
    });
    const input = normalizeSupabaseInbound(raw);
    expect(input?.name).toBe(SRTSP_DOMAIN_EVENTS.NOTIFICATION_CREATED);
  });

  it("ignore les tables non mappées", () => {
    const raw = toTransportInboundMessage({
      schema: "public",
      table: "profiles",
      eventType: "UPDATE",
      new: { id: "p1" },
      old: {},
    });
    expect(normalizeSupabaseInbound(raw)).toBeNull();
  });
});

describe("Supabase Realtime transport", () => {
  it("connect / disconnect", async () => {
    const mock = createMockSupabaseHarness();
    const transport = createSupabaseTransport({ client: mock.client, subscriptions: [{ table: "tracks" }] });
    const mgr = new TransportManager(transport);
    await mgr.connect();
    expect(transport.isConnected()).toBe(true);
    await mgr.disconnect();
    expect(transport.isConnected()).toBe(false);
  });

  it("disabled reste offline", async () => {
    const mock = createMockSupabaseHarness();
    const transport = createSupabaseTransport({ client: mock.client, disabled: true });
    const mgr = new TransportManager(transport);
    await mgr.connect();
    expect(transport.isConnected()).toBe(false);
  });

  it("propage postgres_changes vers inbound handlers", async () => {
    const mock = createMockSupabaseHarness();
    const transport = createSupabaseTransport({
      client: mock.client,
      subscriptions: [{ table: "tracks", events: ["UPDATE"] }],
    });
    const mgr = new TransportManager(transport);
    const received: unknown[] = [];
    mgr.onInbound((raw) => received.push(raw));
    await mgr.connect();
    mock.emitChange({
      schema: "public",
      table: "tracks",
      eventType: "UPDATE",
      commit_timestamp: "2026-07-05T00:00:02Z",
      new: { id: TRACK_ID, creator_id: CREATOR_ID },
      old: { id: TRACK_ID },
    });
    expect(received).toHaveLength(1);
    await mgr.disconnect();
  });

  it("reconnect restaure la connexion", async () => {
    const mock = createMockSupabaseHarness();
    const transport = createSupabaseTransport({ client: mock.client });
    const mgr = new TransportManager(transport, { maxReconnectAttempts: 2, reconnectDelayMs: 1 });
    await mgr.connect();
    await mgr.disconnect();
    expect(mgr.getState()).toBe("offline");
    await mgr.reconnect();
    expect(mgr.getStats().connected).toBe(true);
    expect(mgr.getState()).toBe("online");
  });
});

describe("Engine transport ingestion", () => {
  beforeEach(() => {
    resetSynchronizationEngineForTests();
    resetEventRegistryForTests();
  });

  it("ingère un événement Supabase via TransportManager", async () => {
    const mock = createMockSupabaseHarness();
    const transport = createSupabaseTransport({
      client: mock.client,
      subscriptions: [{ table: "tracks", events: ["UPDATE"] }],
    });
    const engine = new SynchronizationEngine({ transport });
    let count = 0;
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED }, () => {
      count += 1;
    });
    await engine.connectTransport();
    mock.emitChange({
      schema: "public",
      table: "tracks",
      eventType: "UPDATE",
      commit_timestamp: "2026-07-05T00:00:03Z",
      new: { id: TRACK_ID, creator_id: CREATOR_ID },
      old: { id: TRACK_ID },
    });
    expect(count).toBe(1);
    expect(engine.getMetrics().transport.messagesReceived).toBe(1);
  });

  it("déduplique les événements transport identiques", async () => {
    const mock = createMockSupabaseHarness();
    const transport = createSupabaseTransport({
      client: mock.client,
      subscriptions: [{ table: "tracks", events: ["DELETE"] }],
    });
    const engine = new SynchronizationEngine({ transport });
    let count = 0;
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_DELETED }, () => {
      count += 1;
    });
    await engine.connectTransport();
    const payload: SupabasePostgresChangePayload = {
      schema: "public",
      table: "tracks",
      eventType: "DELETE",
      commit_timestamp: "2026-07-05T00:00:04Z",
      new: {},
      old: { id: TRACK_ID, creator_id: CREATOR_ID },
    };
    mock.emitChange(payload);
    mock.emitChange(payload);
    expect(count).toBe(1);
  });

  it("tolère payload invalide sans crash", async () => {
    const mock = createMockSupabaseHarness();
    const transport = createSupabaseTransport({
      client: mock.client,
      subscriptions: [{ table: "tracks", events: ["UPDATE"] }],
    });
    const engine = new SynchronizationEngine({ transport });
    await engine.connectTransport();
    mock.emitChange({
      schema: "public",
      table: "tracks",
      eventType: "UPDATE",
      commit_timestamp: "2026-07-05T00:00:05Z",
      new: { id: "not-a-uuid" },
      old: {},
    });
    expect(engine.getJournalRecent().some((e) => e.code === "TRANSPORT_INGEST_SKIP")).toBe(true);
  });
});
