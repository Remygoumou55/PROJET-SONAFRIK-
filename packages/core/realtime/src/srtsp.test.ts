import { describe, expect, it, beforeEach } from "vitest";
import { EventBus } from "../src/bus/event-bus";
import { EventDispatcher } from "../src/dispatcher/event-dispatcher";
import { DeduplicationStore } from "../src/engine/deduplication";
import { EventQueue } from "../src/engine/event-queue";
import { OfflineBuffer } from "../src/engine/offline-buffer";
import {
  SynchronizationEngine,
  resetSynchronizationEngineForTests,
} from "../src/engine/synchronization-engine";
import { buildSrtspEventContract } from "../src/registry/event-contract";
import { getEventRegistry, resetEventRegistryForTests } from "../src/registry/event-registry";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import { EventGuard } from "../src/security/event-guard";
import { SubscriptionManager } from "../src/subscription/subscription-manager";
import {
  createNoopTransport,
  createPollingTransport,
  createSseTransportStub,
  createSupabaseTransportStub,
  createWebSocketTransportStub,
} from "../src/transport/adapters";
import { TransportManager } from "../src/transport/transport-manager";
import type { SrtspEvent } from "../src/types";

const trackPayload = {
  trackId: "550e8400-e29b-41d4-a716-446655440000",
  creatorId: "660e8400-e29b-41d4-a716-446655440001",
};

function makeEvent(overrides: Partial<SrtspEvent> = {}): SrtspEvent {
  return {
    id: "evt_1",
    name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
    type: "domain",
    version: 1,
    payload: trackPayload,
    source: "catalog",
    destinations: ["publications"],
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("SRTSP EventBus", () => {
  it("publie et distribue aux abonnés", () => {
    const bus = new EventBus();
    const received: SrtspEvent[] = [];
    bus.subscribe(SRTSP_DOMAIN_EVENTS.TRACK_UPDATED, (e) => received.push(e));
    bus.deliver(makeEvent());
    expect(received).toHaveLength(1);
  });
});

describe("SRTSP Deduplication", () => {
  it("bloque les doublons", () => {
    const dedup = new DeduplicationStore(5_000);
    expect(dedup.isDuplicate("key-a")).toBe(false);
    expect(dedup.isDuplicate("key-a")).toBe(true);
  });
});

describe("SRTSP EventQueue", () => {
  it("retente en cas d'échec", async () => {
    const queue = new EventQueue({ maxRetries: 2, baseDelayMs: 1, timeoutMs: 500 });
    let attempts = 0;
    queue.enqueue(makeEvent());
    await queue.flush(async () => {
      attempts += 1;
      if (attempts < 2) throw new Error("fail");
    });
    expect(attempts).toBe(2);
  });
});

describe("SRTSP OfflineBuffer", () => {
  it("buffer puis drain", () => {
    const offline = new OfflineBuffer();
    offline.setOnline(false);
    offline.bufferEvent(makeEvent());
    expect(offline.drain()).toHaveLength(1);
  });
});

describe("SRTSP EventContract", () => {
  beforeEach(() => resetEventRegistryForTests());

  it("construit un contrat complet v1.1", () => {
    const registry = getEventRegistry();
    const event = buildSrtspEventContract(
      registry,
      { name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED, payload: trackPayload, source: "catalog" },
      trackPayload,
    );
    expect(event.id).toBeTruthy();
    expect(event.type).toBe("domain");
    expect(event.version).toBe(1);
    expect(event.destinations.length).toBeGreaterThan(0);
  });
});

describe("SRTSP Security", () => {
  it("supprime champs sensibles du payload", () => {
    const guard = new EventGuard();
    const out = guard.sanitizePayload({
      trackId: trackPayload.trackId,
      api_key: "secret",
      nested: { access_token: "x" },
    });
    expect(out.trackId).toBe(trackPayload.trackId);
    expect(out.api_key).toBeUndefined();
    expect((out.nested as Record<string, unknown>).access_token).toBeUndefined();
  });
});

describe("SRTSP TransportLayer", () => {
  it("noop connect/disconnect", async () => {
    const mgr = new TransportManager(createNoopTransport());
    await mgr.connect();
    expect(mgr.getStats().connected).toBe(true);
    await mgr.disconnect();
    expect(mgr.getState()).toBe("offline");
  });

  it("polling reçoit messages", async () => {
    const polling = createPollingTransport({ intervalMs: 60_000 });
    const mgr = new TransportManager(polling);
    const received: unknown[] = [];
    mgr.onInbound((raw) => received.push(raw));
    await mgr.connect();
    polling.tick();
    expect(received.length).toBeGreaterThan(0);
    await mgr.disconnect();
  });

  it("stubs websocket/sse/supabase instanciables", () => {
    expect(createWebSocketTransportStub().kind).toBe("websocket");
    expect(createSseTransportStub().kind).toBe("sse");
    expect(createSupabaseTransportStub().kind).toBe("supabase");
  });
});

describe("SRTSP SynchronizationEngine Enterprise", () => {
  beforeEach(() => {
    resetSynchronizationEngineForTests();
    resetEventRegistryForTests();
  });

  it("publish + metrics API", () => {
    const engine = new SynchronizationEngine();
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED }, () => {});
    engine.publish({
      name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
      payload: trackPayload,
      source: "catalog",
    });
    const metrics = engine.getMetrics();
    expect(metrics.events.published).toBeGreaterThan(0);
    expect(metrics.subscriptions.active).toBe(1);
  });

  it("rejette payload invalide et journalise", () => {
    const engine = new SynchronizationEngine();
    expect(() =>
      engine.publish({
        name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
        payload: { trackId: "bad" },
        source: "catalog",
      }),
    ).toThrow();
    expect(engine.getJournalRecent().length).toBeGreaterThan(0);
    expect(engine.getMetrics().events.rejected).toBe(1);
  });

  it("déduplique", () => {
    const engine = new SynchronizationEngine();
    let count = 0;
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE }, () => {
      count += 1;
    });
    const input = {
      name: SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
      payload: { creatorId: trackPayload.creatorId! },
      source: "catalog" as const,
      dedupeKey: "dup",
    };
    engine.publish(input);
    engine.publish(input);
    expect(count).toBe(1);
  });

  it("offline flush", () => {
    const engine = new SynchronizationEngine();
    let count = 0;
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED }, () => {
      count += 1;
    });
    engine.setOnline(false);
    engine.publish({
      name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
      payload: trackPayload,
      source: "catalog",
    });
    engine.setOnline(true);
    expect(count).toBe(1);
  });

  it("concurrence 500 événements", () => {
    const engine = new SynchronizationEngine();
    let count = 0;
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE }, () => {
      count += 1;
    });
    for (let i = 0; i < 500; i += 1) {
      engine.publish({
        name: SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
        payload: { creatorId: trackPayload.creatorId! },
        source: "catalog",
        dedupeKey: `e-${i}`,
      });
    }
    expect(count).toBe(500);
  });

  it("unsubscribe libère mémoire", () => {
    const engine = new SynchronizationEngine();
    let count = 0;
    const unsub = engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED }, () => {
      count += 1;
    });
    engine.publish({ name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED, payload: trackPayload, source: "catalog" });
    unsub();
    engine.publish({
      name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
      payload: trackPayload,
      source: "catalog",
      dedupeKey: "k2",
    });
    expect(count).toBe(1);
    expect(engine.subscriptions.count()).toBe(0);
  });
});

describe("SRTSP SubscriptionManager", () => {
  it("filtre destination", () => {
    const bus = new EventBus();
    const mgr = new SubscriptionManager();
    let hits = 0;
    mgr.subscribe(
      bus,
      { destination: "publications", eventName: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED },
      () => {
        hits += 1;
      },
    );
    bus.deliver(makeEvent({ destinations: ["publications"] }));
    bus.deliver(makeEvent({ destinations: ["wallet"] }));
    expect(hits).toBe(1);
  });
});

describe("SRTSP EventDispatcher", () => {
  it("notifie destinations", () => {
    const dispatcher = new EventDispatcher(new SubscriptionManager());
    const notified: string[] = [];
    dispatcher.dispatch(makeEvent({ destinations: ["publications", "dashboard"] }), (d) => {
      notified.push(d);
    });
    expect(notified).toEqual(["publications", "dashboard"]);
  });
});
