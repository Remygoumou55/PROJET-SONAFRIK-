import { describe, expect, it } from "vitest";
import { ISRC_REGISTRY_STATUS } from "@sonafrik/types";
import { InMemoryISRCRepository } from "./InMemoryISRCRepository";
import { brandISRC } from "../utils/branding";

describe("InMemoryISRCRepository", () => {
  it("persists and retrieves entries", async () => {
    const repo = new InMemoryISRCRepository();
    const isrc = brandISRC("GNSFK2400001");
    const entry = {
      isrc,
      status: ISRC_REGISTRY_STATUS.AVAILABLE,
      metadataId: null,
      trackId: null,
      reservedBy: null,
      reservedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repo.saveEntry(entry);
    expect(await repo.findByValue(isrc)).toEqual(entry);
    expect(await repo.findByStatus(ISRC_REGISTRY_STATUS.AVAILABLE)).toHaveLength(1);
    await repo.deleteEntry(isrc);
    expect(await repo.findByValue(isrc)).toBeNull();
    expect(repo.size()).toBe(0);
  });
});
