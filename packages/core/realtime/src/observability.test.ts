import { beforeEach, describe, expect, it } from "vitest";
import { SynchronizationEngine } from "../src/engine/synchronization-engine";
import { resetEventRegistryForTests } from "../src/registry/event-registry";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import { assertMetricsCoherent } from "../src/diagnostics";
import { EventQueue } from "../src/engine/event-queue";
import type { SrtspEvent } from "../src/types";

const trackPayload = {
  trackId: "550e8400-e29b-41d4-a716-446655440000",
  creatorId: "660e8400-e29b-41d4-a716-446655440001",
};

describe("SRTSP Phase 2.2 — Observabilité", () => {
  beforeEach(() => resetEventRegistryForTests());

  it("métriques cohérentes après publications", () => {
    const engine = new SynchronizationEngine();
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED }, () => {});
    engine.publish({
      name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
      payload: trackPayload,
      source: "catalog",
    });
    const metrics = engine.getMetrics();
    assertMetricsCoherent(metrics, { minDelivered: 1 });
    expect(metrics.events.published).toBeGreaterThan(0);
    expect(metrics.events.received).toBe(1);
    expect(metrics.subscriptions.active).toBe(1);
    expect(metrics.latency.samples).toBeGreaterThan(0);
    expect(metrics.latency.maxPropagationMs).toBeGreaterThanOrEqual(metrics.latency.avgPropagationMs);
  });

  it("journal trace pipeline quand enablePipelineTrace actif", () => {
    const engine = new SynchronizationEngine({ enablePipelineTrace: true });
    engine.publish({
      name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
      payload: trackPayload,
      source: "catalog",
    });
    const traces = engine.getJournalRecent().filter((e) => e.code === "PIPELINE_TRACE");
    expect(traces.length).toBeGreaterThan(3);
    expect(traces.some((e) => e.message === "bus.delivered")).toBe(true);
  });

  it("rejet comptabilisé dans métriques et journal", () => {
    const engine = new SynchronizationEngine();
    expect(() =>
      engine.publish({
        name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
        payload: { trackId: "invalid" },
        source: "catalog",
      }),
    ).toThrow();
    const metrics = engine.getMetrics();
    expect(metrics.events.rejected).toBe(1);
    expect(engine.getJournalRecent().some((e) => e.code === "PUBLISH_REJECTED")).toBe(true);
  });

  it("retry queue incrémente compteur retries", async () => {
    const queue = new EventQueue({ maxRetries: 2, baseDelayMs: 1, timeoutMs: 500 });
    let attempts = 0;
    queue.enqueue({
      id: "q1",
      name: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
      type: "domain",
      version: 1,
      payload: trackPayload,
      source: "catalog",
      destinations: ["publications"],
      timestamp: Date.now(),
    } satisfies SrtspEvent);
    await queue.flush(async () => {
      attempts += 1;
      if (attempts < 2) throw new Error("retry");
    });
    expect(queue.getStats().retries).toBeGreaterThan(0);
  });

  it("snapshot inclut transport, bus, offline, deduplication", () => {
    const engine = new SynchronizationEngine();
    const snap = engine.getSnapshot();
    expect(snap.bus).toBeDefined();
    expect(snap.transport).toBeDefined();
    expect(snap.offline).toBeDefined();
    expect(snap.deduplication).toBeDefined();
    expect(snap.latency.maxPropagationMs).toBeDefined();
  });
});
