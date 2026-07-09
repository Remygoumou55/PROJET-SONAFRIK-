import type { Track } from "@sonafrik/types";
import { describe, expect, it } from "vitest";
import {
  insightsRecordFromList,
  shouldLoadPublicationInsight,
  sortTracksWithInsights,
} from "./insights";
import type { PublicationTrackInsight } from "./types";

const insight = (
  track_id: string,
  streams: number,
  revenue_gnf: number | null = null,
): PublicationTrackInsight => ({
  track_id,
  streams,
  revenue_gnf,
  last_activity_at: null,
});

const track = (id: string): Track => ({ id }) as Track;

describe("publication-library insights", () => {
  it("shouldLoadPublicationInsight — only published/pending_review", () => {
    expect(shouldLoadPublicationInsight("published")).toBe(true);
    expect(shouldLoadPublicationInsight("pending_review")).toBe(true);
    expect(shouldLoadPublicationInsight("draft")).toBe(false);
    expect(shouldLoadPublicationInsight("archived")).toBe(false);
    expect(shouldLoadPublicationInsight("rejected")).toBe(false);
  });

  it("insightsRecordFromList — indexes by track_id", () => {
    const record = insightsRecordFromList([insight("a", 10), insight("b", 5)]);
    expect(record.a?.streams).toBe(10);
    expect(record.b?.streams).toBe(5);
  });

  it("sortTracksWithInsights — streams desc without mutating input", () => {
    const tracks = [track("a"), track("b"), track("c")];
    const record = insightsRecordFromList([
      insight("a", 3),
      insight("b", 9),
      insight("c", 1),
    ]);
    const sorted = sortTracksWithInsights(tracks, "streams_desc", record);
    expect(sorted.map((t) => t.id)).toEqual(["b", "a", "c"]);
    expect(tracks.map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("sortTracksWithInsights — revenue desc", () => {
    const tracks = [track("a"), track("b")];
    const record = insightsRecordFromList([insight("a", 0, 100), insight("b", 0, 900)]);
    const sorted = sortTracksWithInsights(tracks, "revenue_desc", record);
    expect(sorted.map((t) => t.id)).toEqual(["b", "a"]);
  });

  it("sortTracksWithInsights — non client-side sort keeps server order", () => {
    const tracks = [track("a"), track("b")];
    const sorted = sortTracksWithInsights(tracks, "updated_desc", {});
    expect(sorted).toBe(tracks);
  });
});
