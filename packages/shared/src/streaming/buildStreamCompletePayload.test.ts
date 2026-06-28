import { describe, expect, it } from "vitest";
import { buildStreamCompletePayload } from "./buildStreamCompletePayload";

describe("buildStreamCompletePayload", () => {
  it("utilise le max entre position audio et heartbeat", () => {
    const payload = buildStreamCompletePayload({
      sessionId: "s1",
      positionSeconds: 120,
      accumulatedSeconds: 90,
      durationSeconds: 180,
      mode: "manual",
    });
    expect(payload.positionSeconds).toBe(120);
    expect(payload.totalDurationSeconds).toBe(180);
  });

  it("plafonne à 90% minimum en fin naturelle", () => {
    const payload = buildStreamCompletePayload({
      sessionId: "s1",
      positionSeconds: 10,
      accumulatedSeconds: 10,
      durationSeconds: 100,
      mode: "natural",
    });
    expect(payload.positionSeconds).toBe(90);
  });
});
