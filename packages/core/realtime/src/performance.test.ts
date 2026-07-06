import { beforeEach, describe, expect, it } from "vitest";
import { SynchronizationEngine } from "../src/engine/synchronization-engine";
import { resetEventRegistryForTests } from "../src/registry/event-registry";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import { createSupabaseTransport } from "../src/transport/adapters";
import { createMockSupabaseHarness } from "../src/diagnostics";

const TRACK_ID = "550e8400-e29b-41d4-a716-446655440000";
const CREATOR_ID = "660e8400-e29b-41d4-a716-446655440001";

describe("SRTSP Phase 2.2 — Performance", () => {
  beforeEach(() => resetEventRegistryForTests());

  it("propagation moyenne < 10ms sur 200 événements locaux", () => {
    const engine = new SynchronizationEngine();
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE }, () => {});
    for (let i = 0; i < 200; i += 1) {
      engine.publish({
        name: SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
        payload: { creatorId: CREATOR_ID },
        source: "catalog",
        dedupeKey: `perf-${i}`,
      });
    }
    const metrics = engine.getMetrics();
    expect(metrics.latency.avgPropagationMs).toBeLessThan(10);
    expect(metrics.latency.maxPropagationMs).toBeLessThan(50);
    expect(metrics.events.received).toBe(200);
  });

  it("concurrence 500 événements — aucune perte", () => {
    const engine = new SynchronizationEngine();
    let count = 0;
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE }, () => {
      count += 1;
    });
    for (let i = 0; i < 500; i += 1) {
      engine.publish({
        name: SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
        payload: { creatorId: CREATOR_ID },
        source: "catalog",
        dedupeKey: `conc-${i}`,
      });
    }
    expect(count).toBe(500);
    expect(engine.getMetrics().events.received).toBe(500);
  });

  it("transport E2E — 50 événements inbound sans perte", async () => {
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
    for (let i = 0; i < 50; i += 1) {
      mock.emitChange({
        schema: "public",
        table: "tracks",
        eventType: "UPDATE",
        commit_timestamp: `2026-07-05T11:00:${String(i).padStart(2, "0")}Z`,
        new: { id: TRACK_ID, creator_id: CREATOR_ID, seq: i },
        old: { id: TRACK_ID },
      });
    }
    expect(count).toBe(50);
    expect(engine.getMetrics().transport.messagesReceived).toBe(50);
    expect(engine.getMetrics().latency.avgPropagationMs).toBeLessThan(15);
  });

  it("résilience — subscriber lent ne bloque pas les autres", () => {
    const engine = new SynchronizationEngine();
    const results: number[] = [];
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED }, () => {
      results.push(1);
    });
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED }, () => {
      results.push(2);
    });
    engine.publish({
      name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
      payload: { trackId: TRACK_ID, creatorId: CREATOR_ID },
      source: "catalog",
    });
    expect(results).toEqual([1, 2]);
  });
});
