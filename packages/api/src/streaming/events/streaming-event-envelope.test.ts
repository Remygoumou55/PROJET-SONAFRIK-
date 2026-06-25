import { describe, expect, it } from "vitest";
import { createEventEnvelope } from "./streaming-event-envelope";

describe("streaming-event-envelope", () => {
  it("creates envelope with default version and timestamp", () => {
    const envelope = createEventEnvelope({
      eventId: "evt-1",
      eventType: "PlaybackRequested",
      correlationId: "corr-1",
      actorId: "user-1",
      payload: { trackId: "track-1" },
    });

    expect(envelope.eventVersion).toBe("1.0.0");
    expect(envelope.occurredAt).toBeTruthy();
    expect(envelope.payload).toEqual({ trackId: "track-1" });
  });
});
