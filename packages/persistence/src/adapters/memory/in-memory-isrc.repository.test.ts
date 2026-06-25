import { describe, expect, it } from "vitest";
import { InMemoryISRCRepository } from "./in-memory-isrc.repository";
import { ISRC_REGISTRY_STATUS } from "@sonafrik/types";
import type { PersistenceContext } from "@sonafrik/types";
import { brandISRC } from "./helpers-isrc";

const ctx: PersistenceContext = {
  actorId: "test",
  correlationId: "corr",
  initiatedAt: new Date().toISOString(),
};

describe("InMemoryISRCRepository", () => {
  it("save, find, reserve, release, archive", async () => {
    const repo = new InMemoryISRCRepository();
    const isrc = brandISRC("GNSFK2400001");
    await repo.saveEntry(
      {
        isrc,
        status: ISRC_REGISTRY_STATUS.AVAILABLE,
        metadataId: null,
        trackId: null,
        reservedBy: null,
        reservedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ctx,
    );
    expect(await repo.findByValue(isrc, ctx)).not.toBeNull();
    await repo.reserve(isrc, "actor", ctx);
    await repo.release(isrc, ctx);
    await repo.archive(isrc, ctx);
    const archived = await repo.findByValue(isrc, ctx);
    expect(archived?.status).toBe(ISRC_REGISTRY_STATUS.ARCHIVED);
  });
});
