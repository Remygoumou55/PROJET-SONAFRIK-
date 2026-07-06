import { describe, expect, it } from "vitest";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import {
  ARTIST_PROFILE_HUB_EXTENDED_EVENTS,
  ARTIST_PROFILE_HUB_IGNORED_EVENTS,
  ARTIST_PROFILE_HUB_PREPARED_EVENTS,
  ARTIST_PROFILE_HUB_SRTSP_EVENTS,
  isArtistProfileHubIgnoredEvent,
  isArtistProfileHubPreparedEvent,
  shouldRefreshArtistProfileHub,
} from "../src/adapters/artist-profile-hub-consumer";
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
    source: "creator",
    destinations: ["identity"],
    timestamp: Date.now(),
  };
}

describe("Artist Profile Hub SRTSP consumer", () => {
  it("écoute artist.updated / avatar / verification / profile.invalidate", () => {
    for (const name of [
      SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED,
      "artist.avatar.updated",
      "artist.verification.updated",
      "profile.invalidate",
      "identity.profile.updated",
    ]) {
      expect(
        shouldRefreshArtistProfileHub(evt(name, { creatorId: CREATOR_ID }), {
          creatorId: CREATOR_ID,
          userId: USER_ID,
        }),
      ).toBe(true);
    }
  });

  it("ignore événements wizard intermédiaires", () => {
    for (const name of ARTIST_PROFILE_HUB_IGNORED_EVENTS) {
      expect(isArtistProfileHubIgnoredEvent(name)).toBe(true);
      expect(
        shouldRefreshArtistProfileHub(evt(name, { creatorId: CREATOR_ID }), { creatorId: CREATOR_ID }),
      ).toBe(false);
    }
  });

  it("prépare wallet/analytics/stream sans consommation active", () => {
    for (const name of ARTIST_PROFILE_HUB_PREPARED_EVENTS) {
      expect(isArtistProfileHubPreparedEvent(name)).toBe(true);
      expect(ARTIST_PROFILE_HUB_SRTSP_EVENTS as readonly string[]).not.toContain(name);
      expect(
        shouldRefreshArtistProfileHub(evt(name, { creatorId: CREATOR_ID }), { creatorId: CREATOR_ID }),
      ).toBe(false);
    }
  });

  it("ignore autre créateur", () => {
    expect(
      shouldRefreshArtistProfileHub(
        evt(SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED, { creatorId: OTHER }),
        { creatorId: CREATOR_ID },
      ),
    ).toBe(false);
  });

  it("filtre identity.invalidate par userId", () => {
    expect(
      shouldRefreshArtistProfileHub(evt("identity.invalidate", { userId: USER_ID }), {
        creatorId: CREATOR_ID,
        userId: USER_ID,
      }),
    ).toBe(true);
    expect(
      shouldRefreshArtistProfileHub(evt("identity.invalidate", { userId: OTHER }), {
        creatorId: CREATOR_ID,
        userId: USER_ID,
      }),
    ).toBe(false);
  });

  it("couvre alias extended prep", () => {
    for (const name of ARTIST_PROFILE_HUB_EXTENDED_EVENTS) {
      expect(ARTIST_PROFILE_HUB_SRTSP_EVENTS as readonly string[]).toContain(name);
    }
  });
});
