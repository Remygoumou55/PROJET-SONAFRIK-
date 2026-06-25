import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PersistenceError } from "@sonafrik/persistence";
import {
  METADATA_SOURCE,
  METADATA_STATUS,
  METADATA_VALIDATION_STATE,
  METADATA_VISIBILITY,
} from "@sonafrik/types";
import type { MetadataDomainRecord } from "@sonafrik/types";
import {
  ApplicationConflictError,
  ApplicationError,
  ApplicationNotFoundError,
  BusinessRuleViolation,
  NotAuthorizedError,
  ValidationFailedError,
  mapPersistenceToApplication,
} from "./application/errors";
import {
  metadataArchivedEvent,
  metadataCreatedEvent,
  metadataReleasedEvent,
  metadataReservedEvent,
  metadataRestoredEvent,
  metadataValidatedEvent,
} from "./application/events";
import { toISRCReservationDto, toMetadataRecordDto, toMetadataRecordDtos, toMetadataStatusDto } from "./application/mappers";
import { assertActor, assertAdmin, InMemoryApplicationEventPublisher, toMetadataContext, toPersistenceContext } from "./application/ports";
import {
  assertValidatable,
  inputToDomainRecord,
  validateISRCValue,
  validateMetadataInput,
  validateSearchInput,
} from "./application/validators";
import {
  executeCreateMetadata,
  executeUpdateMetadata,
} from "./application/use-cases/metadata-command.use-cases";
import { createUseCaseDeps } from "./application/use-cases/isrc-command.use-cases";
import {
  executeFindMetadata,
  executeGetMetadataById,
  executeGetMetadataStatus,
  executeSearchMetadata,
} from "./application/use-cases/metadata-query.use-cases";
import { createInMemoryMetadataApplicationService } from "./application/services";

const actorId = randomUUID();
const correlationId = randomUUID();
const now = new Date().toISOString();

function baseRecord(): MetadataDomainRecord {
  return {
    id: randomUUID() as never,
    trackId: randomUUID() as never,
    title: "Track",
    isrc: null,
    durationSeconds: 120,
    language: null,
    explicit: false,
    genreIds: [],
    status: METADATA_STATUS.DRAFT,
    source: METADATA_SOURCE.MANUAL,
    visibility: METADATA_VISIBILITY.PRIVATE,
    validationState: METADATA_VALIDATION_STATE.PENDING,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

describe("application errors", () => {
  it("maps persistence error codes", () => {
    expect(
      mapPersistenceToApplication(new PersistenceError("persistence_duplicate", "dup")).name,
    ).toBe("ApplicationConflictError");
    expect(
      mapPersistenceToApplication(new PersistenceError("persistence_conflict", "conflict")).name,
    ).toBe("ApplicationConflictError");
    expect(
      mapPersistenceToApplication(new PersistenceError("persistence_validation", "bad")).name,
    ).toBe("ValidationFailedError");
    expect(
      mapPersistenceToApplication(new PersistenceError("persistence_timeout", "slow")).code,
    ).toBe("application_unknown");
    expect(mapPersistenceToApplication(new ApplicationError("application_unknown")).name).toBe(
      "ApplicationError",
    );
    expect(mapPersistenceToApplication("raw").code).toBe("application_unknown");
    expect(mapPersistenceToApplication(new Error("boom")).message).toBe("boom");
  });

  it("instantiates error classes", () => {
    expect(new BusinessRuleViolation().name).toBe("BusinessRuleViolation");
    expect(new ApplicationConflictError().name).toBe("ApplicationConflictError");
    expect(new NotAuthorizedError().name).toBe("NotAuthorizedError");
    expect(new ApplicationNotFoundError().name).toBe("ApplicationNotFoundError");
    expect(new ValidationFailedError().name).toBe("ValidationFailedError");
  });
});

describe("application events", () => {
  it("builds domain events", () => {
    expect(metadataCreatedEvent(actorId, correlationId, "m1").type).toBe("MetadataCreated");
    expect(metadataValidatedEvent(actorId, correlationId, "m1").type).toBe("MetadataValidated");
    expect(metadataReservedEvent(actorId, correlationId, "GNSFK2400001").type).toBe(
      "MetadataReserved",
    );
    expect(metadataArchivedEvent(actorId, correlationId, "m1").type).toBe("MetadataArchived");
    expect(metadataReleasedEvent(actorId, correlationId, "GNSFK2400001").type).toBe(
      "MetadataReleased",
    );
    expect(metadataRestoredEvent(actorId, correlationId, "m1").type).toBe("MetadataRestored");
  });
});

describe("application context", () => {
  it("maps contexts and enforces guards", () => {
    const ctx = { actorId, correlationId, initiatedAt: now, isAdmin: true };
    expect(toPersistenceContext(ctx).actorId).toBe(actorId);
    expect(toMetadataContext(ctx).locale).toBe("fr-GN");
    expect(() => assertActor({ actorId: "  ", correlationId })).toThrow(NotAuthorizedError);
    expect(() => assertAdmin({ actorId, correlationId })).toThrow(NotAuthorizedError);
  });
});

describe("validators", () => {
  it("rejects invalid metadata input", () => {
    expect(() => validateMetadataInput({})).toThrow(ValidationFailedError);
    expect(() => validateSearchInput({ limit: 200 })).toThrow(ValidationFailedError);
  });

  it("builds artist domain record via default branch", () => {
    const id = randomUUID();
    const input = validateMetadataInput({
      id,
      entityType: "artist",
      entityId: randomUUID(),
      status: "draft",
      source: "manual",
      visibility: "private",
      validationState: "pending",
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    const record = inputToDomainRecord(input);
    expect("trackId" in record).toBe(true);
  });

  it("builds album domain record", () => {
    const id = randomUUID();
    const input = validateMetadataInput({
      id,
      entityType: "album",
      entityId: randomUUID(),
      status: "draft",
      source: "manual",
      visibility: "private",
      validationState: "pending",
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    const record = inputToDomainRecord(input);
    expect("albumId" in record).toBe(true);
  });

  it("rejects validating archived records", () => {
    const archived = { ...baseRecord(), status: METADATA_STATUS.ARCHIVED };
    expect(() => assertValidatable(archived)).toThrow(ValidationFailedError);
    expect(() => assertValidatable(baseRecord())).not.toThrow();
  });
});

describe("mappers", () => {
  it("maps entity types to DTOs", () => {
    const track = baseRecord();
    expect(toMetadataRecordDto(track).entityType).toBe("track");
    expect(toMetadataStatusDto(track).status).toBe(METADATA_STATUS.DRAFT);
    expect(toMetadataRecordDtos([track])).toHaveLength(1);

    const album: MetadataDomainRecord = {
      id: randomUUID() as never,
      albumId: randomUUID() as never,
      title: "Album",
      upc: null,
      releaseType: "album",
      releaseDate: null,
      genreIds: [],
      status: METADATA_STATUS.DRAFT,
      source: METADATA_SOURCE.MANUAL,
      visibility: METADATA_VISIBILITY.PRIVATE,
      validationState: METADATA_VALIDATION_STATE.PENDING,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    expect(toMetadataRecordDto(album).entityType).toBe("album");

    const isrcDto = toISRCReservationDto({
      isrc: "GNSFK2400001" as never,
      status: "available",
      metadataId: null,
      trackId: null,
      reservedBy: null,
      reservedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    expect(isrcDto.isrc).toBe("GNSFK2400001");
  });
});

describe("use case edge paths", () => {
  it("validate unknown metadata throws not found", async () => {
    const service = createInMemoryMetadataApplicationService();
    await expect(
      service.executeCommand({ actorId, correlationId }, {
        type: "ValidateMetadata",
        metadataId: randomUUID(),
      }),
    ).rejects.toBeInstanceOf(ApplicationNotFoundError);
  });

  it("restore unknown version maps to application error", async () => {
    const service = createInMemoryMetadataApplicationService();
    await expect(
      service.executeCommand({ actorId, correlationId, isAdmin: true }, {
        type: "RestoreMetadata",
        versionId: randomUUID(),
      }),
    ).rejects.toBeInstanceOf(ApplicationError);
  });

  it("update metadata increments version", async () => {
    const service = createInMemoryMetadataApplicationService();
    const id = randomUUID();
    const entityId = randomUUID();
    const payload = {
      id,
      entityType: "track" as const,
      entityId,
      status: "draft" as const,
      source: "manual" as const,
      visibility: "private" as const,
      validationState: "pending" as const,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    await service.executeCommand({ actorId, correlationId }, { type: "CreateMetadata", payload });
    const updated = await service.executeCommand({ actorId, correlationId }, {
      type: "UpdateMetadata",
      payload: { ...payload, version: 1, updatedAt: new Date().toISOString() },
    });
    expect(updated.version).toBe(2);
  });

  it("find metadata via search fallback", async () => {
    const service = createInMemoryMetadataApplicationService();
    const payload = {
      id: randomUUID(),
      entityType: "track" as const,
      entityId: randomUUID(),
      status: "draft" as const,
      source: "manual" as const,
      visibility: "private" as const,
      validationState: "pending" as const,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    await service.executeCommand({ actorId, correlationId }, { type: "CreateMetadata", payload });
    const found = await service.executeQuery({ actorId, correlationId }, {
      type: "FindMetadata",
      entityType: "release",
      entityId: payload.entityId,
    });
    expect(found?.id).toBe(payload.id);
    expect(validateISRCValue("GNSFK2400001")).toBe("GNSFK2400001");
    expect(service.getEventPublisher()).toBeDefined();
  });

  it("maps persistence failures in direct use cases", async () => {
    const events = new InMemoryApplicationEventPublisher();
    const throwingRepo = {
      save: async () => {
        throw new PersistenceError("persistence_validation", "invalid");
      },
      findById: async () => null,
      archive: async () => undefined,
      search: async () => [],
      findTrackMetadata: async () => null,
      findAlbumMetadata: async () => null,
      findArtistMetadata: async () => null,
      findReleaseMetadata: async () => null,
      findRoyaltyMetadata: async () => null,
      findDistributionMetadata: async () => null,
      findFingerprintMetadata: async () => null,
      findVersionMetadata: async () => null,
      findAuditMetadata: async () => null,
      findStorageMetadata: async () => null,
      findDeliveryMetadata: async () => null,
    };
    const ports = {
      repositories: {
        metadata: throwingRepo,
        isrc: { reserve: async () => ({}), release: async () => ({}), saveEntry: async () => ({}) },
        version: { restore: async () => ({}) },
      },
      transactionManager: { run: async (fn: () => Promise<unknown>) => fn() },
    } as never;
    const deps = createUseCaseDeps(ports, events);
    const ctx = { actorId, correlationId };
    const payload = {
      id: randomUUID(),
      entityType: "track" as const,
      entityId: randomUUID(),
      status: "draft" as const,
      source: "manual" as const,
      visibility: "private" as const,
      validationState: "pending" as const,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    await expect(
      executeCreateMetadata(deps, ctx, { type: "CreateMetadata", payload }),
    ).rejects.toBeInstanceOf(ValidationFailedError);
    await expect(
      executeUpdateMetadata(deps, ctx, { type: "UpdateMetadata", payload }),
    ).rejects.toBeInstanceOf(ValidationFailedError);
    await expect(
      executeFindMetadata(ports, ctx, "track", randomUUID()),
    ).resolves.toBeNull();
    await expect(
      executeFindMetadata(ports, ctx, "album", randomUUID()),
    ).resolves.toBeNull();
    await expect(executeGetMetadataById(ports, ctx, randomUUID())).resolves.toBeNull();
    await expect(executeGetMetadataStatus(ports, ctx, randomUUID())).resolves.toBeNull();
    await expect(executeSearchMetadata(ports, ctx, { limit: 5 })).resolves.toEqual({
      items: [],
      total: 0,
    });
  });
});
