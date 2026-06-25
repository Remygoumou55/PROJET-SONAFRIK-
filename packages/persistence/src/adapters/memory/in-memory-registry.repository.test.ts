import { describe, expect, it } from "vitest";
import { InMemoryRegistryRepository } from "./in-memory-registry.repository";
import { brandISRC } from "./helpers-isrc";
import type { PersistenceContext } from "@sonafrik/types";

const ctx: PersistenceContext = {
  actorId: "actor",
  correlationId: "corr",
  initiatedAt: new Date().toISOString(),
};

describe("InMemoryRegistryRepository", () => {
  it("registers and resolves ISRC/UPC mappings", async () => {
    const repo = new InMemoryRegistryRepository();
    const metadataId = "meta-1" as import("@sonafrik/types").MetadataID;
    const isrc = brandISRC("GNSFK2400001");
    await repo.registerIsrc(isrc, metadataId, ctx);
    expect(await repo.lookupByIsrc(isrc, ctx)).toBe(metadataId);
    await repo.unregister(metadataId, ctx);
    expect(await repo.lookupByIsrc(isrc, ctx)).toBeNull();
  });
});
