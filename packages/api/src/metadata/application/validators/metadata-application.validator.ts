import type { AlbumID, MetadataDomainRecord, MetadataID, TrackID } from "@sonafrik/types";
import { ValidationFailedError } from "../errors";
import {
  isrcValueSchema,
  metadataRecordInputSchema,
  searchMetadataSchema,
  type MetadataRecordInput,
  type SearchMetadataInput,
} from "./metadata.schemas";

export function validateMetadataInput(input: unknown): MetadataRecordInput {
  const result = metadataRecordInputSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationFailedError(result.error.message);
  }
  return result.data;
}

export function validateSearchInput(input: unknown): SearchMetadataInput {
  const result = searchMetadataSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationFailedError(result.error.message);
  }
  return result.data;
}

export function validateISRCValue(isrc: string): string {
  const result = isrcValueSchema.safeParse(isrc);
  if (!result.success) {
    throw new ValidationFailedError(result.error.message);
  }
  return result.data;
}

/** Build minimal domain record from validated input — no auto ISRC */
export function inputToDomainRecord(input: MetadataRecordInput): MetadataDomainRecord {
  const base = {
    id: input.id as MetadataID,
    status: input.status,
    source: input.source,
    visibility: input.visibility,
    validationState: input.validationState,
    version: input.version,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };

  switch (input.entityType) {
    case "track":
      return {
        ...base,
        trackId: input.entityId as TrackID,
        title: "",
        isrc: null,
        durationSeconds: null,
        language: null,
        explicit: false,
        genreIds: [],
      };
    case "album":
      return {
        ...base,
        albumId: input.entityId as AlbumID,
        title: "",
        upc: null,
        releaseType: "album",
        releaseDate: null,
        genreIds: [],
      };
    default:
      return {
        ...base,
        trackId: input.entityId as TrackID,
        title: "",
        isrc: null,
        durationSeconds: null,
        language: null,
        explicit: false,
        genreIds: [],
      };
  }
}

export function assertValidatable(record: MetadataDomainRecord): void {
  if (record.status === "archived") {
    throw new ValidationFailedError("Impossible de valider un enregistrement archivé");
  }
}
