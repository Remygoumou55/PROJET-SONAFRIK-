import { describe, expect, it } from "vitest";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import {
  CREATOR_DASHBOARD_IGNORED_EVENTS,
  CREATOR_DASHBOARD_SRTSP_EVENTS,
  isDashboardIgnoredEvent,
  shouldRefreshCreatorDashboard,
} from "../src/adapters/creator-dashboard-consumer";
import type { SrtspEvent } from "../src/types";

const CREATOR_ID = "660e8400-e29b-41d4-a716-446655440001";
const USER_ID = "770e8400-e29b-41d4-a716-446655440002";
const OTHER = "880e8400-e29b-41d4-a716-446655440003";

function evt(name: string, payload: Record<string, unknown>): SrtspEvent {
  return {
    id: "e1",
    name,
    type: "domain",
    version: 1,
    payload,
    source: "publication",
    destinations: ["dashboard"],
    timestamp: Date.now(),
  };
}

describe("Creator Dashboard SRTSP consumer", () => {
  it("écoute submitted / approved / rejected / deleted", () => {
    for (const name of [
      SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
      SRTSP_DOMAIN_EVENTS.PUBLICATION_APPROVED,
      SRTSP_DOMAIN_EVENTS.PUBLICATION_REJECTED,
      SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
    ]) {
      expect(
        shouldRefreshCreatorDashboard(evt(name, { creatorId: CREATOR_ID }), { creatorId: CREATOR_ID }),
      ).toBe(true);
    }
  });

  it("ignore événements wizard intermédiaires", () => {
    for (const name of CREATOR_DASHBOARD_IGNORED_EVENTS) {
      expect(isDashboardIgnoredEvent(name)).toBe(true);
      expect(
        shouldRefreshCreatorDashboard(evt(name, { creatorId: CREATOR_ID }), { creatorId: CREATOR_ID }),
      ).toBe(false);
    }
  });

  it("ignore autre créateur", () => {
    expect(
      shouldRefreshCreatorDashboard(
        evt(SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED, { creatorId: OTHER }),
        { creatorId: CREATOR_ID },
      ),
    ).toBe(false);
  });

  it("wallet — filtre userId", () => {
    expect(
      shouldRefreshCreatorDashboard(
        evt(SRTSP_DOMAIN_EVENTS.WALLET_UPDATED, { userId: USER_ID }),
        { creatorId: CREATOR_ID, userId: USER_ID },
      ),
    ).toBe(true);
    expect(
      shouldRefreshCreatorDashboard(
        evt(SRTSP_DOMAIN_EVENTS.WALLET_UPDATED, { userId: OTHER }),
        { creatorId: CREATOR_ID, userId: USER_ID },
      ),
    ).toBe(false);
  });

  it("liste dashboard ne contient pas audio/metadata wizard", () => {
    expect(CREATOR_DASHBOARD_SRTSP_EVENTS).not.toContain(SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED);
    expect(CREATOR_DASHBOARD_SRTSP_EVENTS).not.toContain(SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED);
  });
});
