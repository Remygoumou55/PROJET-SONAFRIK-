import { describe, expect, it } from "vitest";
import { SRTSP_DOMAIN_EVENTS } from "../src/registry/domain-events";
import {
  ADMIN_HUB_CATALOG_EVENTS,
  ADMIN_HUB_IGNORED_EVENTS,
  ADMIN_HUB_PREPARED_EVENTS,
  ADMIN_HUB_SRTSP_EVENTS,
  ADMIN_HUB_STREAMING_EVENTS,
  isAdminHubIgnoredEvent,
  isAdminHubPreparedEvent,
  shouldRefreshAdminAnalytics,
  shouldRefreshAdminCatalog,
  shouldRefreshAdminFraud,
  shouldRefreshAdminHub,
  shouldRefreshAdminSnapshot,
  shouldRefreshAdminWallet,
} from "../src/adapters/admin-hub-consumer";
import type { SrtspEvent } from "../src/types";

function evt(name: string): SrtspEvent {
  return {
    id: "e1",
    name,
    type: "domain",
    version: 1,
    payload: {},
    source: "admin",
    destinations: ["admin"],
    timestamp: Date.now(),
  };
}

describe("Admin Hub SRTSP consumer", () => {
  it("écoute snapshot · publication · wallet · streaming", () => {
    for (const name of [
      SRTSP_DOMAIN_EVENTS.ADMIN_SNAPSHOT_INVALIDATE,
      SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
      SRTSP_DOMAIN_EVENTS.WITHDRAWAL_UPDATED,
      SRTSP_DOMAIN_EVENTS.STREAMING_STARTED,
    ]) {
      expect(ADMIN_HUB_SRTSP_EVENTS as readonly string[]).toContain(name);
    }
  });

  it("filtre catalogue et publication", () => {
    expect(shouldRefreshAdminCatalog(evt(SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED))).toBe(true);
    expect(shouldRefreshAdminCatalog(evt(SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED))).toBe(true);
    expect(shouldRefreshAdminCatalog(evt("admin.catalog.updated"))).toBe(true);
  });

  it("filtre wallet supervision", () => {
    expect(shouldRefreshAdminWallet(evt(SRTSP_DOMAIN_EVENTS.WITHDRAWAL_UPDATED))).toBe(true);
    expect(shouldRefreshAdminWallet(evt("withdrawal.approved"))).toBe(true);
  });

  it("filtre fraude et streaming", () => {
    for (const name of ADMIN_HUB_STREAMING_EVENTS) {
      expect(shouldRefreshAdminFraud(evt(name))).toBe(true);
    }
    expect(shouldRefreshAdminFraud(evt("admin.fraud.updated"))).toBe(true);
  });

  it("filtre analytics live", () => {
    expect(shouldRefreshAdminAnalytics(evt(SRTSP_DOMAIN_EVENTS.STREAMING_STARTED))).toBe(true);
    expect(shouldRefreshAdminAnalytics(evt(SRTSP_DOMAIN_EVENTS.ANALYTICS_INVALIDATE))).toBe(true);
  });

  it("hub unifié = snapshot supervision", () => {
    expect(shouldRefreshAdminHub(evt(SRTSP_DOMAIN_EVENTS.ADMIN_SNAPSHOT_INVALIDATE))).toBe(true);
    expect(shouldRefreshAdminSnapshot(evt(SRTSP_DOMAIN_EVENTS.TRACK_PUBLISHED))).toBe(true);
  });

  it("ignore wizard et prépare stream.play", () => {
    for (const name of ADMIN_HUB_IGNORED_EVENTS) {
      expect(isAdminHubIgnoredEvent(name)).toBe(true);
      expect(shouldRefreshAdminHub(evt(name))).toBe(false);
    }
    for (const name of ADMIN_HUB_PREPARED_EVENTS) {
      expect(isAdminHubPreparedEvent(name)).toBe(true);
      expect(ADMIN_HUB_SRTSP_EVENTS as readonly string[]).not.toContain(name);
    }
  });

  it("couvre groupes catalog streaming", () => {
    for (const name of ADMIN_HUB_CATALOG_EVENTS) {
      expect(ADMIN_HUB_SRTSP_EVENTS as readonly string[]).toContain(name);
    }
  });
});
