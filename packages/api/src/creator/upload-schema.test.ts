import { describe, expect, it } from "vitest";
import { DEV_MOCK_CREATOR_ID } from "@sonafrik/shared/auth";
import { creatorAssetUploadSchema } from "./schemas";
import { resolveCreatorAssetUploadError } from "../shared/uploadSchemaErrors";

describe("creatorAssetUploadSchema", () => {
  const validInput = {
    creatorId: DEV_MOCK_CREATOR_ID,
    assetKind: "gallery" as const,
    contentType: "image/jpeg" as const,
  };

  it("accepte un payload creator valide (mock UUID dev)", () => {
    expect(creatorAssetUploadSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejette un creatorId non-UUID (BUG upload P1)", () => {
    const result = creatorAssetUploadSchema.safeParse({
      ...validInput,
      creatorId: "dev-creator-id",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(resolveCreatorAssetUploadError(result.error)).toBe("invalid_creator_id");
  });

  it("rejette un contentType vide", () => {
    const result = creatorAssetUploadSchema.safeParse({
      ...validInput,
      contentType: "",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(resolveCreatorAssetUploadError(result.error)).toBe("invalid_content_type");
  });

  it("accepte image/png et application/pdf", () => {
    expect(
      creatorAssetUploadSchema.safeParse({ ...validInput, contentType: "image/png" }).success,
    ).toBe(true);
    expect(
      creatorAssetUploadSchema.safeParse({
        creatorId: DEV_MOCK_CREATOR_ID,
        assetKind: "verification",
        contentType: "application/pdf",
        verificationId: "00000000-0000-4000-a000-000000000003",
      }).success,
    ).toBe(true);
  });
});
