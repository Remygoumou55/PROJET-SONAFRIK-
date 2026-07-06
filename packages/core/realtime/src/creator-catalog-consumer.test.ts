import { describe, expect, it } from "vitest";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import {
  CREATOR_CATALOG_IGNORED_EVENTS,
  CREATOR_CATALOG_SRTSP_EVENTS,
  isCatalogIgnoredEvent,
  shouldRefreshCreatorCatalog,
} from "../src/adapters/creator-catalog-consumer";
import type { SrtspEvent } from "../src/types";

const CREATOR_ID = "660e8400-e29b-41d4-a716-446655440001";
const OTHER = "880e8400-e29b-41d4-a716-446655440003";

function evt(name: string, payload: Record<string, unknown>): SrtspEvent {
  return {
    id: "e1",
    name,
    type: "domain",
    version: 1,
    payload,
    source: "catalog",
    destinations: ["catalog"],
    timestamp: Date.now(),
  };
}

describe("Creator Catalog SRTSP consumer", () => {
  it("écoute publication approved / deleted et track lifecycle", () => {
    for (const name of [
      SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
      SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
      SRTSP_DOMAIN_EVENTS.TRACK_CREATED,
      SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
      SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
      SRTSP_DOMAIN_EVENTS.ALBUM_PUBLISHED,
      SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE,
    ]) {
      expect(
        shouldRefreshCreatorCatalog(evt(name, { creatorId: CREATOR_ID }), { creatorId: CREATOR_ID }),
      ).toBe(true);
    }
  });

  it("ignore événements wizard intermédiaires", () => {
    for (const name of CREATOR_CATALOG_IGNORED_EVENTS) {
      expect(isCatalogIgnoredEvent(name)).toBe(true);
      expect(
        shouldRefreshCreatorCatalog(evt(name, { creatorId: CREATOR_ID }), { creatorId: CREATOR_ID }),
      ).toBe(false);
    }
  });

  it("ignore autre créateur", () => {
    expect(
      shouldRefreshCreatorCatalog(
        evt(SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED, { creatorId: OTHER }),
        { creatorId: CREATOR_ID },
      ),
    ).toBe(false);
  });

  it("liste catalogue ne contient pas audio/metadata wizard", () => {
    expect(CREATOR_CATALOG_SRTSP_EVENTS).not.toContain(SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED);
    expect(CREATOR_CATALOG_SRTSP_EVENTS).not.toContain(SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED);
  });

  it("accepte catalog.invalidate sans creatorId explicite", () => {
    expect(
      shouldRefreshCreatorCatalog(evt(SRTSP_DOMAIN_EVENTS.CATALOG_INVALIDATE, {}), {
        creatorId: CREATOR_ID,
      }),
    ).toBe(true);
  });
});
