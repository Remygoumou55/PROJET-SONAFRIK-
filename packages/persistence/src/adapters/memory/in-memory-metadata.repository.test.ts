import { describe, expect, it } from "vitest";
import { InMemoryMetadataRepository } from "./in-memory-metadata.repository";
import type { MetadataDomainRecord, PersistenceContext } from "@sonafrik/types";

const ctx: PersistenceContext = {
  actorId: "actor",
  correlationId: "corr",
  initiatedAt: new Date().toISOString(),
};

const sampleRecord = {
  id: "meta-1",
  entityType: "track",
  entityId: "track-1",
  status: "draft",
  isrc: null,
  upc: null,
  fingerprintId: null,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as MetadataDomainRecord;

describe("InMemoryMetadataRepository", () => {
  it("save, findById, search, archive", async () => {
    const repo = new InMemoryMetadataRepository();
    await repo.save(sampleRecord, ctx);
    expect(await repo.findById(sampleRecord.id, ctx)).toEqual(sampleRecord);
    expect((await repo.search({}, ctx)).length).toBe(1);
    await repo.archive(sampleRecord.id, ctx);
    const archived = await repo.findById(sampleRecord.id, ctx);
    expect(archived?.status).toBe("archived");
  });
});
