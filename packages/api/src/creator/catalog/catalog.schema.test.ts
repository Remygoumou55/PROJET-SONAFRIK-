import { describe, expect, it } from "vitest";
import {
  catalogAssetConfirmSchema,
  catalogAssetUploadSchema,
  createAlbumSchema,
  createTrackSchema,
} from "./schemas";

const UUID = "849836a7-d234-4c11-b8af-a65a53bfc525";

describe("catalog schemas", () => {
  it("accepts valid album create payload", () => {
    const parsed = createAlbumSchema.safeParse({
      title: "Mon Single",
      releaseType: "single",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects album title too short", () => {
    const parsed = createAlbumSchema.safeParse({
      title: "A",
      releaseType: "single",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid track create payload", () => {
    const parsed = createTrackSchema.safeParse({
      title: "Mon Morceau",
      language: "fr",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts catalog audio upload payload", () => {
    const parsed = catalogAssetUploadSchema.safeParse({
      creatorId: UUID,
      assetType: "audio",
      contentType: "audio/mpeg",
      trackId: UUID,
      format: "mp3",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid creator id on upload", () => {
    const parsed = catalogAssetUploadSchema.safeParse({
      creatorId: "not-a-uuid",
      assetType: "audio",
      contentType: "audio/mpeg",
      trackId: UUID,
      format: "mp3",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts catalog audio confirm payload", () => {
    const parsed = catalogAssetConfirmSchema.safeParse({
      creatorId: UUID,
      trackId: UUID,
      path: `${UUID}/tracks/${UUID}/master.mp3`,
      format: "mp3",
      contentType: "audio/mpeg",
      fileSizeBytes: 1024,
      durationSeconds: 180,
      contentHash: "a".repeat(64),
    });
    expect(parsed.success).toBe(true);
  });
});
