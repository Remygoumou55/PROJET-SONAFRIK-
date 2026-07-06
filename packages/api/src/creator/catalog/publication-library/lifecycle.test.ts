import { describe, expect, it } from "vitest";
import type { Track } from "@sonafrik/types";
import { getPublicationActions } from "./actions";
import { buildPublicationLifecycleTimeline } from "./lifecycle";

const baseTrack: Track = {
  id: "t1",
  creator_id: "c1",
  album_id: "a1",
  title: "Test",
  slug: "test",
  track_number: 1,
  isrc: null,
  duration_seconds: 180,
  explicit: false,
  language: "fr",
  bpm: null,
  musical_key: null,
  publication_status: "draft",
  rejection_reason: null,
  submitted_at: null,
  published_at: null,
  metadata: {},
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-02T10:00:00Z",
  deleted_at: null,
};

describe("publicationLifecycle", () => {
  it("inclut création et brouillon", () => {
    const events = buildPublicationLifecycleTimeline(baseTrack);
    expect(events.some((e) => e.phase === "created")).toBe(true);
    expect(events.some((e) => e.phase === "draft")).toBe(true);
  });

  it("inclut rejet avec motif", () => {
    const events = buildPublicationLifecycleTimeline({
      ...baseTrack,
      publication_status: "rejected",
      submitted_at: "2026-01-03T10:00:00Z",
      rejection_reason: "Qualité audio insuffisante",
    });
    expect(events.some((e) => e.label === "Publication rejetée")).toBe(true);
  });
});

describe("publicationActions", () => {
  it("actions brouillon", () => {
    const actions = getPublicationActions("draft");
    expect(actions.map((a) => a.id)).toEqual(["edit", "continue", "delete"]);
  });

  it("actions en revue — lecture seule", () => {
    const actions = getPublicationActions("pending_review");
    expect(actions).toHaveLength(1);
    expect(actions[0]?.id).toBe("view");
    expect(actions[0]?.label).toBe("Voir");
  });

  it("actions publié", () => {
    const ids = getPublicationActions("published").map((a) => a.id);
    expect(ids).toEqual(["view", "share", "consult"]);
  });

  it("actions rejeté", () => {
    const ids = getPublicationActions("rejected").map((a) => a.id);
    expect(ids).toEqual(["view", "correct", "resubmit"]);
  });

  it("actions archivé — lecture seule", () => {
    const actions = getPublicationActions("archived");
    expect(actions).toHaveLength(1);
    expect(actions[0]?.id).toBe("view");
  });
});

describe("publicationLifecycle — archivé", () => {
  it("inclut phase archivée", () => {
    const events = buildPublicationLifecycleTimeline({
      ...baseTrack,
      publication_status: "archived",
    });
    expect(events.some((e) => e.phase === "archived")).toBe(true);
  });
});
