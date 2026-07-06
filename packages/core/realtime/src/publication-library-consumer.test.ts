import { describe, expect, it } from "vitest";
import { buildSrtspEventContract } from "../src/registry/event-contract";
import { getEventRegistry, resetEventRegistryForTests } from "../src/registry/event-registry";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import {
  PUBLICATION_LIBRARY_EVENT_EFFECTS,
  PUBLICATION_LIBRARY_SRTSP_EVENTS,
  shouldRefreshPublicationLibrary,
} from "../src/adapters/publication-library-consumer";
import type { SrtspEvent } from "../src/types";

const CREATOR_A = "660e8400-e29b-41d4-a716-446655440001";
const CREATOR_B = "770e8400-e29b-41d4-a716-446655440002";
const TRACK_ID = "550e8400-e29b-41d4-a716-446655440000";
const ALBUM_ID = "aa0e8400-e29b-41d4-a716-446655440000";

function makePublicationEvent(
  name: string,
  creatorId: string,
  overrides: Partial<SrtspEvent> = {},
): SrtspEvent {
  return {
    id: "evt_1",
    name,
    type: "domain",
    version: 1,
    payload: { albumId: ALBUM_ID, trackId: TRACK_ID, creatorId },
    source: "publication",
    destinations: ["publications"],
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("Publication Library SRTSP consumer", () => {
  it("cartographie couvre les événements minimum Phase 3.2", () => {
    const mapped = new Set(PUBLICATION_LIBRARY_EVENT_EFFECTS.map((e) => e.event));
    for (const event of PUBLICATION_LIBRARY_SRTSP_EVENTS) {
      expect(mapped.has(event)).toBe(true);
    }
  });

  it("shouldRefreshPublicationLibrary — même créateur", () => {
    const event = makePublicationEvent(SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED, CREATOR_A);
    expect(shouldRefreshPublicationLibrary(event, CREATOR_A)).toBe(true);
  });

  it("shouldRefreshPublicationLibrary — ignore autre créateur", () => {
    const event = makePublicationEvent(SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED, CREATOR_B);
    expect(shouldRefreshPublicationLibrary(event, CREATOR_A)).toBe(false);
  });

  it("shouldRefreshPublicationLibrary — CATALOG_INVALIDATE par creatorId", () => {
    const event = makePublicationEvent(SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE, CREATOR_A, {
      source: "catalog",
      payload: { creatorId: CREATOR_A },
    });
    expect(shouldRefreshPublicationLibrary(event, CREATOR_A)).toBe(true);
  });

  it("ignore événement hors liste", () => {
    const event = makePublicationEvent(SRTSP_DOMAIN_EVENTS.SYSTEM_HEARTBEAT, CREATOR_A);
    expect(shouldRefreshPublicationLibrary(event, CREATOR_A)).toBe(false);
  });
});

describe("Publication Library live invalidation E2E", () => {
  it("soumission wizard déclenche refresh consommateur", () => {
    resetEventRegistryForTests();
    const registry = getEventRegistry();
    const event = buildSrtspEventContract(
      registry,
      {
        name: SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
        source: "publication",
        payload: { albumId: ALBUM_ID, trackId: TRACK_ID, creatorId: CREATOR_A, title: "Test" },
      },
      { albumId: ALBUM_ID, trackId: TRACK_ID, creatorId: CREATOR_A, title: "Test" },
    );
    expect(shouldRefreshPublicationLibrary(event, CREATOR_A)).toBe(true);
    expect(event.destinations).toContain("publications");
  });
});
