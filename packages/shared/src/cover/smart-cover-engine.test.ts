import { describe, expect, it } from "vitest";
import {
  computeCenterSquareCrop,
  detectSmartCoverOrientation,
  resolveSmartCoverAdvisory,
} from "./smart-cover-engine";
import { SMART_COVER_MESSAGES, mapCoverErrorToUserMessage } from "./smart-cover-messages";

describe("SmartCoverEngine — pure logic", () => {
  it("detectSmartCoverOrientation", () => {
    expect(detectSmartCoverOrientation(1000, 1000)).toBe("square");
    expect(detectSmartCoverOrientation(1600, 900)).toBe("landscape");
    expect(detectSmartCoverOrientation(900, 1600)).toBe("portrait");
  });

  it("computeCenterSquareCrop — centré", () => {
    expect(computeCenterSquareCrop(1600, 900)).toEqual({ sx: 350, sy: 0, side: 900 });
    expect(computeCenterSquareCrop(900, 1600)).toEqual({ sx: 0, sy: 350, side: 900 });
    expect(computeCenterSquareCrop(1400, 1400)).toEqual({ sx: 0, sy: 0, side: 1400 });
  });

  it("resolveSmartCoverAdvisory — petites images non bloquantes", () => {
    expect(resolveSmartCoverAdvisory(600, 600).advisory).toBe(
      SMART_COVER_MESSAGES.smallCompatible,
    );
    expect(resolveSmartCoverAdvisory(1200, 1200).advisory).toBe(
      SMART_COVER_MESSAGES.smallCompatible,
    );
  });

  it("mapCoverErrorToUserMessage — masque le jargon technique", () => {
    expect(mapCoverErrorToUserMessage(new Error("Edge Function returned 500"))).toBe(
      SMART_COVER_MESSAGES.uploadFailed,
    );
    expect(mapCoverErrorToUserMessage(new Error("canvas_blob_failed"))).toBe(
      SMART_COVER_MESSAGES.qualityFailed,
    );
  });
});
