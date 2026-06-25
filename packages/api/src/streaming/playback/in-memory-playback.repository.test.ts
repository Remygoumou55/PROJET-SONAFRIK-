import { describe, expect, it } from "vitest";
import { InMemoryPlaybackPositionRepository, InMemorySignedUrlRepository } from "./in-memory-playback.repository";
import { InMemorySessionRepository } from "../session/in-memory-session.repository";

describe("InMemoryPlayback repositories", () => {
  it("issue et renew signed URL avec session alignée", async () => {
    const sessionRepo = new InMemorySessionRepository();
    const signedUrls = new InMemorySignedUrlRepository(sessionRepo);
    const issued = await signedUrls.issue({
      actorId: "user-1",
      trackId: "track-1",
      platform: "web",
      qualityLevel: "medium",
    });
    expect(issued.signedUrl).toContain(issued.sessionId);
    expect(signedUrls.validate(issued.signedUrl, issued.expiresAt)).toBe(true);
    expect(signedUrls.validate("", issued.expiresAt)).toBe(false);

    const renewed = await signedUrls.renew({
      actorId: "user-1",
      trackId: "track-1",
      platform: "web",
      qualityLevel: "high",
      sessionId: issued.sessionId,
    });
    expect(renewed.sessionId).toBe(issued.sessionId);
  });

  it("issue sans session repository", async () => {
    const signedUrls = new InMemorySignedUrlRepository();
    const issued = await signedUrls.issue({
      actorId: "solo",
      trackId: "track-x",
      platform: "web",
    });
    expect(issued.sessionId).toBeTruthy();
  });

  it("playback position save/find", async () => {
    const positions = new InMemoryPlaybackPositionRepository();
    await positions.save("user-1", "track-1", 55);
    const found = await positions.find("user-1", "track-1");
    expect(found?.position_seconds).toBe(55);
    expect(await positions.find("user-1", "track-2")).toBeNull();
  });
});
