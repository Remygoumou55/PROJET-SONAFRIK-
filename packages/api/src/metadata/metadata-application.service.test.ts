import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PersistenceContainer, PersistenceError } from "@sonafrik/persistence";
import { ISRC_REGISTRY_STATUS } from "@sonafrik/types";
import {
  createInMemoryMetadataApplicationService,
  createMetadataApplicationService,
} from "./application/services";
import { NotAuthorizedError, mapPersistenceToApplication } from "./application/errors";
import { InMemoryApplicationEventPublisher } from "./application/ports";
import { toMetadataRecordDto } from "./application/mappers";
import {
  inputToDomainRecord,
  validateISRCValue,
  validateMetadataInput,
} from "./application/validators";

const actorId = randomUUID();
const correlationId = randomUUID();

function ctx(admin = false) {
  return { actorId, correlationId, isAdmin: admin };
}

function trackPayload() {
  const id = randomUUID();
  const now = new Date().toISOString();
  return {
    id,
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
}

describe("MetadataApplicationService", () => {
  it("create → get by id → validate → archive", async () => {
    const events = new InMemoryApplicationEventPublisher();
    const service = createInMemoryMetadataApplicationService(events);

    const payload = trackPayload();
    const created = await service.executeCommand(ctx(), {
      type: "CreateMetadata",
      payload,
    });
    expect(created.id).toBe(payload.id);

    const found = await service.executeQuery(ctx(), {
      type: "GetMetadataById",
      metadataId: payload.id,
    });
    expect(found).not.toBeNull();

    const validated = await service.executeCommand(ctx(), {
      type: "ValidateMetadata",
      metadataId: payload.id,
    });
    expect(validated.status).toBe("validated");

    await service.executeCommand(ctx(), {
      type: "ArchiveMetadata",
      metadataId: payload.id,
    });

    const status = await service.executeQuery(ctx(), {
      type: "GetMetadataStatus",
      metadataId: payload.id,
    });
    expect(status?.status).toBe("archived");
    expect(events.events.some((e) => e.type === "MetadataCreated")).toBe(true);
  });

  it("search metadata", async () => {
    const service = createInMemoryMetadataApplicationService();
    const payload = trackPayload();
    await service.executeCommand(ctx(), { type: "CreateMetadata", payload });
    const result = await service.executeQuery(ctx(), {
      type: "SearchMetadata",
      filter: { status: "draft", limit: 10 },
    });
    expect(result).toHaveProperty("items");
  });

  it("reserve ISRC requires admin", async () => {
    const service = createInMemoryMetadataApplicationService();
    await expect(
      service.executeCommand(ctx(false), {
        type: "ReserveISRC",
        isrc: "GNSFK2400001",
      }),
    ).rejects.toBeInstanceOf(NotAuthorizedError);
  });

  it("reserve and release ISRC as admin", async () => {
    const isrc = "GNSFK2400001";
    const container = new PersistenceContainer({ provider: "memory" });
    await container.getRepositories().isrc.saveEntry(
      {
        isrc: isrc as never,
        status: ISRC_REGISTRY_STATUS.AVAILABLE,
        metadataId: null,
        trackId: null,
        reservedBy: null,
        reservedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { actorId, correlationId, initiatedAt: new Date().toISOString() },
    );
    const service = createMetadataApplicationService(container);

    const reserved = await service.executeCommand(ctx(true), {
      type: "ReserveISRC",
      isrc,
    });
    expect(reserved).toHaveProperty("status", "reserved");

    const released = await service.executeCommand(ctx(true), {
      type: "ReleaseISRC",
      isrc,
    });
    expect(released).toHaveProperty("status", "available");
  });
});

describe("mappers and validators", () => {
  it("validates ISRC format", () => {
    expect(validateISRCValue("GNSFK2400001")).toBe("GNSFK2400001");
    expect(() => validateISRCValue("bad")).toThrow();
  });

  it("maps persistence not found", () => {
    const mapped = mapPersistenceToApplication(
      new PersistenceError("persistence_not_found", "missing"),
    );
    expect(mapped.name).toBe("ApplicationNotFoundError");
  });

  it("maps domain record to DTO", () => {
    const payload = trackPayload();
    const input = validateMetadataInput(payload);
    const record = inputToDomainRecord(input);
    const dto = toMetadataRecordDto(record);
    expect(dto.entityType).toBe("track");
  });
});
