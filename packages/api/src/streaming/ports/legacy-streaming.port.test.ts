import { describe, expect, it } from "vitest";
import { InMemoryDomainEventPublisher, NoOpLegacyStreamingPort } from "./legacy-streaming.port";

describe("legacy-streaming.port", () => {
  it("stores published events in memory", async () => {
    const publisher = new InMemoryDomainEventPublisher();
    await publisher.publish({
      eventId: "1",
      eventType: "PlaybackRequested",
      eventVersion: "1.0.0",
      correlationId: "c",
      actorId: "a",
      occurredAt: new Date().toISOString(),
      payload: {},
    });
    expect(publisher.published).toHaveLength(1);
  });

  it("delegates legacy path", () => {
    const legacy = new NoOpLegacyStreamingPort();
    expect(legacy.delegateToLegacy()).toEqual({ active: true });
  });
});
