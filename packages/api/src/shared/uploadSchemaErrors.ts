import type { z } from "zod";
import { CATALOG_ERROR_MESSAGES, CREATOR_ERROR_MESSAGES } from "@sonafrik/types";

export function resolveCreatorAssetUploadError(
  error: z.ZodError,
): keyof typeof CREATOR_ERROR_MESSAGES {
  const fields = error.flatten().fieldErrors;
  if (fields.creatorId?.length || fields.verificationId?.length || fields.labelId?.length) {
    return "invalid_creator_id";
  }
  if (fields.contentType?.length || fields.assetKind?.length) {
    return "invalid_content_type";
  }
  return "invalid_upload_payload";
}

export function resolveCatalogAssetUploadError(
  error: z.ZodError,
): keyof typeof CATALOG_ERROR_MESSAGES {
  const fields = error.flatten().fieldErrors;
  if (fields.creatorId?.length) return "invalid_creator_id";
  if (fields.trackId?.length || fields.albumId?.length) return "invalid_upload_payload";
  if (fields.contentType?.length || fields.format?.length || fields.assetType?.length) {
    return "invalid_content_type";
  }
  return "invalid_upload_payload";
}

export function resolveCatalogAssetConfirmError(
  error: z.ZodError,
): keyof typeof CATALOG_ERROR_MESSAGES {
  const fields = error.flatten().fieldErrors;
  if (fields.creatorId?.length || fields.trackId?.length) return "invalid_creator_id";
  if (fields.contentType?.length || fields.format?.length) return "invalid_content_type";
  if (fields.path?.length || fields.fileSizeBytes?.length || fields.contentHash?.length) {
    return "invalid_upload_payload";
  }
  return "invalid_upload_payload";
}
