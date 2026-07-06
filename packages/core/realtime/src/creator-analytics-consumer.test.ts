import { describe, expect, it } from "vitest";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import {
  CREATOR_ANALYTICS_IGNORED_EVENTS,
  CREATOR_ANALYTICS_PREPARED_EVENTS,
  CREATOR_ANALYTICS_SRTSP_EVENTS,
  isAnalyticsIgnoredEvent,
  isAnalyticsPreparedEvent,
  shouldRefreshCreatorAnalytics,
} from "../src/adapters/creator-analytics-consumer";
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
    source: "analytics",
    destinations: ["analytics"],
    timestamp: Date.now(),
  };
}

describe("Creator Analytics SRTSP consumer", () => {
  it("écoute approved / deleted / track lifecycle / analytics.invalidate", () => {
    for (const name of [
      SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
      SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
      SRTSP_DOMAIN_EVENTS.TRACK_UPDATED,
      SRTSP_DOMAIN_EVENTS.TRACK_DELETED,
      SRTSP_DOMAIN_EVENTS.ANALYTICS_INVALIDATE,
    ]) {
      expect(
        shouldRefreshCreatorAnalytics(evt(name, { creatorId: CREATOR_ID }), { creatorId: CREATOR_ID }),
      ).toBe(true);
    }
  });

  it("ignore événements wizard intermédiaires", () => {
    for (const name of CREATOR_ANALYTICS_IGNORED_EVENTS) {
      expect(isAnalyticsIgnoredEvent(name)).toBe(true);
      expect(
        shouldRefreshCreatorAnalytics(evt(name, { creatorId: CREATOR_ID }), { creatorId: CREATOR_ID }),
      ).toBe(false);
    }
  });

  it("prépare wallet/royalty/stream sans consommation active", () => {
    for (const name of CREATOR_ANALYTICS_PREPARED_EVENTS) {
      expect(isAnalyticsPreparedEvent(name)).toBe(true);
      expect(CREATOR_ANALYTICS_SRTSP_EVENTS as readonly string[]).not.toContain(name);
      expect(
        shouldRefreshCreatorAnalytics(evt(name, { creatorId: CREATOR_ID }), { creatorId: CREATOR_ID }),
      ).toBe(false);
    }
  });

  it("ignore autre créateur", () => {
    expect(
      shouldRefreshCreatorAnalytics(
        evt(SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED, { creatorId: OTHER }),
        { creatorId: CREATOR_ID },
      ),
    ).toBe(false);
  });

  it("accepte analytics.invalidate sans creatorId explicite", () => {
    expect(
      shouldRefreshCreatorAnalytics(evt(SRTSP_DOMAIN_EVENTS.ANALYTICS_INVALIDATE, {}), {
        creatorId: CREATOR_ID,
      }),
    ).toBe(true);
  });
});
