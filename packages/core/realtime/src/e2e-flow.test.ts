import { beforeEach, describe, expect, it } from "vitest";
import { SynchronizationEngine } from "../src/engine/synchronization-engine";
import { resetEventRegistryForTests } from "../src/registry/event-registry";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import { createSupabaseTransport } from "../src/transport/adapters";
import {
  assertMetricsCoherent,
  createE2ePipelineReader,
  createMockSupabaseHarness,
  SRTSP_PIPELINE_STAGES,
} from "../src/diagnostics";
import type { SrtspEvent } from "../src/types";

const TRACK_ID = "550e8400-e29b-41d4-a716-446655440000";
const CREATOR_ID = "660e8400-e29b-41d4-a716-446655440001";
const NOTIF_ID = "770e8400-e29b-41d4-a716-446655440002";

function createE2eEngine(mock = createMockSupabaseHarness()) {
  const transport = createSupabaseTransport({
    client: mock.client,
    subscriptions: [
      { table: "tracks", events: ["INSERT", "UPDATE", "DELETE"] },
      { table: "notifications", events: ["INSERT"] },
    ],
  });
  const engine = new SynchronizationEngine({
    transport,
    enablePipelineTrace: true,
  });
  return { engine, mock, pipeline: createE2ePipelineReader(engine) };
}

describe("SRTSP Phase 2.2 — E2E Event Flow Certification", () => {
  beforeEach(() => resetEventRegistryForTests());

  it("INSERT track — parcours complet postgres_changes → subscriber", async () => {
    const { engine, mock, pipeline } = createE2eEngine();
    const received: SrtspEvent[] = [];
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_CREATED }, (e) => received.push(e));

    await engine.connectTransport();
    mock.emitChange({
      schema: "public",
      table: "tracks",
      eventType: "INSERT",
      commit_timestamp: "2026-07-05T10:00:00Z",
      new: { id: TRACK_ID, creator_id: CREATOR_ID },
      old: {},
    });

    expect(received).toHaveLength(1);
    expect(received[0]?.payload.trackId).toBe(TRACK_ID);
    pipeline.assertOrdered([
      SRTSP_PIPELINE_STAGES.TRANSPORT_INBOUND,
      SRTSP_PIPELINE_STAGES.NORMALIZER_MAPPED,
      SRTSP_PIPELINE_STAGES.GUARD_VALIDATED,
      SRTSP_PIPELINE_STAGES.REGISTRY_VALIDATED,
      SRTSP_PIPELINE_STAGES.BUS_DELIVERED,
      SRTSP_PIPELINE_STAGES.DISPATCHER_NOTIFIED,
    ]);
    assertMetricsCoherent(engine.getMetrics(), { minDelivered: 1 });
  });

  it("UPDATE track — modification propagée", async () => {
    const { engine, mock } = createE2eEngine();
    let count = 0;
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED }, () => {
      count += 1;
    });
    await engine.connectTransport();
    mock.emitChange({
      schema: "public",
      table: "tracks",
      eventType: "UPDATE",
      commit_timestamp: "2026-07-05T10:00:01Z",
      new: { id: TRACK_ID, creator_id: CREATOR_ID, title: "Nouveau titre" },
      old: { id: TRACK_ID },
    });
    expect(count).toBe(1);
  });

  it("DELETE track — suppression propagée", async () => {
    const { engine, mock } = createE2eEngine();
    let count = 0;
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_DELETED }, () => {
      count += 1;
    });
    await engine.connectTransport();
    mock.emitChange({
      schema: "public",
      table: "tracks",
      eventType: "DELETE",
      commit_timestamp: "2026-07-05T10:00:02Z",
      new: {},
      old: { id: TRACK_ID, creator_id: CREATOR_ID },
    });
    expect(count).toBe(1);
  });

  it("événements simultanés — ordre préservé", async () => {
    const { engine, mock } = createE2eEngine();
    const order: string[] = [];
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED }, (e) => {
      order.push(String(e.dedupeKey ?? e.id));
    });
    await engine.connectTransport();
    for (let i = 0; i < 5; i += 1) {
      mock.emitChange({
        schema: "public",
        table: "tracks",
        eventType: "UPDATE",
        commit_timestamp: `2026-07-05T10:00:0${i}Z`,
        new: { id: TRACK_ID, creator_id: CREATOR_ID },
        old: { id: TRACK_ID },
      });
    }
    expect(order).toHaveLength(5);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]).not.toBe(order[i - 1]);
    }
  });

  it("déduplication — aucun double traitement", async () => {
    const { engine, mock } = createE2eEngine();
    let count = 0;
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_CREATED }, () => {
      count += 1;
    });
    await engine.connectTransport();
    const payload = {
      schema: "public" as const,
      table: "tracks" as const,
      eventType: "INSERT" as const,
      commit_timestamp: "2026-07-05T10:00:10Z",
      new: { id: TRACK_ID, creator_id: CREATOR_ID },
      old: {},
    };
    mock.emitChange(payload);
    mock.emitChange(payload);
    expect(count).toBe(1);
    expect(engine.getMetrics().events.dropped).toBeGreaterThanOrEqual(1);
  });

  it("offline → flush — synchronisation après retour réseau", async () => {
    const { engine, mock } = createE2eEngine();
    let count = 0;
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_UPDATED }, () => {
      count += 1;
    });
    await engine.connectTransport();
    engine.setOnline(false);
    mock.emitChange({
      schema: "public",
      table: "tracks",
      eventType: "UPDATE",
      commit_timestamp: "2026-07-05T10:00:11Z",
      new: { id: TRACK_ID, creator_id: CREATOR_ID },
      old: { id: TRACK_ID },
    });
    expect(count).toBe(0);
    expect(engine.offline.getStats().buffered).toBe(1);
    engine.setOnline(true);
    expect(count).toBe(1);
  });

  it("reconnexion transport — événements après reconnect", async () => {
    const { engine, mock } = createE2eEngine();
    let count = 0;
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.TRACK_CREATED }, () => {
      count += 1;
    });
    await engine.connectTransport();
    await engine.disconnectTransport();
    await engine.reconnectTransport();
    mock.emitChange({
      schema: "public",
      table: "tracks",
      eventType: "INSERT",
      commit_timestamp: "2026-07-05T10:00:12Z",
      new: { id: "880e8400-e29b-41d4-a716-446655440003", creator_id: CREATOR_ID },
      old: {},
    });
    expect(count).toBe(1);
  });

  it("table non mappée — journalisée sans crash", async () => {
    const mock = createMockSupabaseHarness();
    const transport = createSupabaseTransport({
      client: mock.client,
      subscriptions: [{ table: "profiles", events: ["UPDATE"] }],
    });
    const engine = new SynchronizationEngine({ transport, enablePipelineTrace: true });
    await engine.connectTransport();
    mock.emitChange({
      schema: "public",
      table: "profiles",
      eventType: "UPDATE",
      commit_timestamp: "2026-07-05T10:00:13Z",
      new: { id: "p1" },
      old: {},
    });
    expect(
      engine.getJournalRecent().some((e) => e.code === "TRANSPORT_INBOUND_IGNORED"),
    ).toBe(true);
  });

  it("notification INSERT — chaîne complète", async () => {
    const { engine, mock } = createE2eEngine();
    let count = 0;
    engine.subscribe({ eventName: SRTSP_DOMAIN_EVENTS.NOTIFICATION_CREATED }, () => {
      count += 1;
    });
    await engine.connectTransport();
    mock.emitChange({
      schema: "public",
      table: "notifications",
      eventType: "INSERT",
      commit_timestamp: "2026-07-05T10:00:14Z",
      new: { id: NOTIF_ID, user_id: CREATOR_ID },
      old: {},
    });
    expect(count).toBe(1);
  });
});
