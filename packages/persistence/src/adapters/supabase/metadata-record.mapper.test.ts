import { describe, expect, it } from "vitest";
import { recordToRow, rowToRecord } from "./metadata-record.mapper";
import type { TrackMetadata } from "@sonafrik/types";

describe("metadata-record.mapper", () => {
  const track: TrackMetadata = {
    id: "meta-1" as TrackMetadata["id"],
    trackId: "track-1" as TrackMetadata["trackId"],
    title: "Test",
    isrc: null,
    durationSeconds: 200,
    language: null,
    explicit: false,
    genreIds: [],
    status: "draft",
    source: "system",
    visibility: "private",
    validationState: "pending",
    createdAt: "2026-06-24T00:00:00.000Z",
    updatedAt: "2026-06-24T00:00:00.000Z",
    version: 1,
  };

  it("round-trips record through row mapping", () => {
    const row = recordToRow(track);
    expect(row.entity_type).toBe("track");
    expect(row.entity_id).toBe("track-1");
    const restored = rowToRecord({
      ...(row as ReturnType<typeof recordToRow> & { payload: TrackMetadata }),
      payload: track,
    });
    expect(restored).toEqual(track);
  });
});
