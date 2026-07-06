import { describe, expect, it } from "vitest";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import {
  LISTENER_HUB_ARTIST_IDENTITY_EVENTS,
  LISTENER_HUB_CATALOG_EVENTS,
  LISTENER_HUB_IGNORED_EVENTS,
  LISTENER_HUB_LIBRARY_EVENTS,
  LISTENER_HUB_PREPARED_EVENTS,
  LISTENER_HUB_SRTSP_EVENTS,
  isListenerHubIgnoredEvent,
  isListenerHubPreparedEvent,
  shouldRefreshListenerArtistIdentity,
  shouldRefreshListenerCatalog,
  shouldRefreshListenerDiscovery,
  shouldRefreshListenerHub,
  shouldRefreshListenerLibrary,
  shouldRefreshListenerNotifications,
} from "../src/adapters/listener-hub-consumer";
import type { SrtspEvent } from "../src/types";

const USER_ID = "770e8400-e29b-41d4-a716-446655440002";
const CREATOR_ID = "660e8400-e29b-41d4-a716-446655440001";
const OTHER = "880e8400-e29b-41d4-a716-446655440003";

function evt(name: string, payload: Record<string, unknown>): SrtspEvent {
  return {
    id: "e1",
    name,
    type: "domain",
    version: 1,
    payload,
    source: "listener",
    destinations: ["library"],
    timestamp: Date.now(),
  };
}

describe("Listener Hub SRTSP consumer", () => {
  it("écoute catalog · library · artist · notifications", () => {
    for (const name of [
      SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED,
      SRTSP_DOMAIN_EVENTS.FAVORITE_TOGGLED,
      SRTSP_DOMAIN_EVENTS.PLAYLIST_UPDATED,
      "artist.avatar.updated",
      SRTSP_DOMAIN_EVENTS.NOTIFICATION_CREATED,
    ]) {
      expect(LISTENER_HUB_SRTSP_EVENTS as readonly string[]).toContain(name);
    }
  });

  it("filtre catalogue par creatorId", () => {
    expect(
      shouldRefreshListenerCatalog(evt(SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED, { creatorId: CREATOR_ID }), {
        creatorId: CREATOR_ID,
      }),
    ).toBe(true);
    expect(
      shouldRefreshListenerCatalog(evt(SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED, { creatorId: OTHER }), {
        creatorId: CREATOR_ID,
      }),
    ).toBe(false);
    expect(shouldRefreshListenerCatalog(evt(SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED, {}))).toBe(true);
  });

  it("filtre bibliothèque par userId", () => {
    expect(
      shouldRefreshListenerLibrary(evt(SRTSP_DOMAIN_EVENTS.FAVORITE_TOGGLED, { userId: USER_ID }), {
        userId: USER_ID,
      }),
    ).toBe(true);
    expect(
      shouldRefreshListenerLibrary(evt(SRTSP_DOMAIN_EVENTS.FAVORITE_TOGGLED, { userId: OTHER }), {
        userId: USER_ID,
      }),
    ).toBe(false);
  });

  it("filtre identité artiste par creatorId", () => {
    for (const name of ["artist.avatar.updated", SRTSP_DOMAIN_EVENTS.ARTIST_UPDATED]) {
      expect(
        shouldRefreshListenerArtistIdentity(evt(name, { creatorId: CREATOR_ID }), {
          creatorId: CREATOR_ID,
        }),
      ).toBe(true);
      expect(
        shouldRefreshListenerArtistIdentity(evt(name, { creatorId: OTHER }), {
          creatorId: CREATOR_ID,
        }),
      ).toBe(false);
    }
  });

  it("filtre notifications par userId", () => {
    expect(
      shouldRefreshListenerNotifications(
        evt(SRTSP_DOMAIN_EVENTS.NOTIFICATION_CREATED, { userId: USER_ID }),
        { userId: USER_ID },
      ),
    ).toBe(true);
    expect(
      shouldRefreshListenerNotifications(
        evt(SRTSP_DOMAIN_EVENTS.NOTIFICATION_CREATED, { userId: OTHER }),
        { userId: USER_ID },
      ),
    ).toBe(false);
  });

  it("discovery accepte catalogue sans scope", () => {
    expect(shouldRefreshListenerDiscovery(evt(SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED, {}))).toBe(true);
    expect(shouldRefreshListenerDiscovery(evt("artist.profile.updated", { creatorId: CREATOR_ID }))).toBe(
      true,
    );
  });

  it("ignore événements wizard", () => {
    for (const name of LISTENER_HUB_IGNORED_EVENTS) {
      expect(isListenerHubIgnoredEvent(name)).toBe(true);
      expect(shouldRefreshListenerHub(evt(name, { creatorId: CREATOR_ID }), { userId: USER_ID })).toBe(
        false,
      );
    }
  });

  it("prépare streaming sans consommation active", () => {
    for (const name of LISTENER_HUB_PREPARED_EVENTS) {
      expect(isListenerHubPreparedEvent(name)).toBe(true);
      expect(LISTENER_HUB_SRTSP_EVENTS as readonly string[]).not.toContain(name);
    }
  });

  it("couvre groupes catalog library artist", () => {
    for (const name of LISTENER_HUB_CATALOG_EVENTS) {
      expect(LISTENER_HUB_SRTSP_EVENTS as readonly string[]).toContain(name);
    }
    for (const name of LISTENER_HUB_LIBRARY_EVENTS) {
      expect(LISTENER_HUB_SRTSP_EVENTS as readonly string[]).toContain(name);
    }
    for (const name of LISTENER_HUB_ARTIST_IDENTITY_EVENTS) {
      expect(LISTENER_HUB_SRTSP_EVENTS as readonly string[]).toContain(name);
    }
  });
});
