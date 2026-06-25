import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  METADATA_SOURCE,
  METADATA_STATUS,
  METADATA_VALIDATION_STATE,
  METADATA_VISIBILITY,
} from "@sonafrik/types";
import type { MetadataDomainRecord } from "@sonafrik/types";
import { toMetadataRecordDto } from "./metadata.mapper";

const now = new Date().toISOString();

function base() {
  return {
    id: randomUUID() as never,
    status: METADATA_STATUS.DRAFT,
    source: METADATA_SOURCE.MANUAL,
    visibility: METADATA_VISIBILITY.PRIVATE,
    validationState: METADATA_VALIDATION_STATE.PENDING,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

describe("metadata.mapper entity inference", () => {
  const cases: Array<{ label: string; record: MetadataDomainRecord; entityType: string }> = [
    {
      label: "track",
      entityType: "track",
      record: {
        ...base(),
        trackId: randomUUID() as never,
        title: "T",
        isrc: null,
        durationSeconds: null,
        language: null,
        explicit: false,
        genreIds: [],
      },
    },
    {
      label: "album",
      entityType: "album",
      record: {
        ...base(),
        albumId: randomUUID() as never,
        title: "A",
        upc: null,
        releaseType: "album",
        releaseDate: null,
        genreIds: [],
      },
    },
    {
      label: "artist",
      entityType: "artist",
      record: {
        ...base(),
        artistMetadataId: randomUUID() as never,
        creatorId: randomUUID(),
        stageName: "Artist",
        bio: null,
        countryCode: null,
        genreIds: [],
      },
    },
    {
      label: "release",
      entityType: "release",
      record: {
        ...base(),
        releaseId: randomUUID() as never,
        albumId: null,
        trackIds: [],
        releaseType: "single",
        releaseDate: null,
        territoryCodes: [],
      },
    },
    {
      label: "royalty",
      entityType: "royalty",
      record: {
        ...base(),
        royaltyId: randomUUID() as never,
        trackId: null,
        albumId: null,
        bindingStatus: "unlinked",
        poolSharePercent: null,
      },
    },
    {
      label: "distribution",
      entityType: "distribution",
      record: {
        ...base(),
        distributionId: randomUUID() as never,
        releaseId: randomUUID() as never,
        deliveryId: null,
        distributionStatus: "pending",
        territoryCodes: [],
      },
    },
    {
      label: "fingerprint",
      entityType: "fingerprint",
      record: {
        ...base(),
        fingerprintId: randomUUID() as never,
        trackId: randomUUID() as never,
        fingerprintStatus: "pending",
        hash: null,
        duplicateTrackId: null,
      },
    },
    {
      label: "version",
      entityType: "version",
      record: {
        ...base(),
        versionId: randomUUID() as never,
        entityType: "track",
        entityId: randomUUID(),
        action: "created",
        snapshot: {},
      },
    },
    {
      label: "audit",
      entityType: "audit",
      record: {
        ...base(),
        auditMetadataId: randomUUID() as never,
        actorId: randomUUID(),
        action: "create",
        entityType: "track",
        entityId: randomUUID(),
        payload: {},
      },
    },
    {
      label: "storage",
      entityType: "storage",
      record: {
        ...base(),
        storageId: randomUUID() as never,
        bucket: "audio",
        path: "/a.wav",
        mimeType: "audio/wav",
        byteSize: 1,
        checksum: null,
      },
    },
    {
      label: "delivery",
      entityType: "delivery",
      record: {
        ...base(),
        deliveryId: randomUUID() as never,
        distributionId: randomUUID() as never,
        partnerCode: "DSP",
        payloadFormat: "json",
        deliveredAt: null,
      },
    },
  ];

  it.each(cases)("$label maps entityType", ({ record, entityType }) => {
    expect(toMetadataRecordDto(record).entityType).toBe(entityType);
  });

  it("falls back to unknown entity type", () => {
    const orphan = { ...base(), trackId: "" as never, title: "", isrc: null, durationSeconds: null, language: null, explicit: false, genreIds: [] };
    expect(toMetadataRecordDto(orphan as MetadataDomainRecord).entityType).toBe("unknown");
  });
});
