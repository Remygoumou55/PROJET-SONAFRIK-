import { describe, expect, it } from "vitest";
import { InMemoryISRCSequenceRepository } from "../adapters/memory/in-memory-isrc.repository";
import { InMemoryMetadataRepository } from "../adapters/memory/in-memory-metadata.repository";
import type { MetadataDomainRecord, PersistenceContext } from "@sonafrik/types";

const ctx: PersistenceContext = {
  actorId: "stress-test",
  correlationId: "stress",
  initiatedAt: new Date().toISOString(),
};

/** Simulates PostgreSQL atomic advance (RPC metadata_advance_isrc_sequence) */
class AtomicSequenceSimulator {
  private last = 0;
  private chain: Promise<void> = Promise.resolve();

  async advance(): Promise<number> {
    let result = 0;
    this.chain = this.chain.then(async () => {
      this.last += 1;
      result = this.last;
    });
    await this.chain;
    return result;
  }
}

describe("concurrency — sequence advance", () => {
  it("handles 100 parallel in-memory advances", async () => {
    const repo = new InMemoryISRCSequenceRepository();
    const key = { countryCode: "GN", registrantCode: "SFK", yearOfReference: "24" };
    const results = await Promise.all(
      Array.from({ length: 100 }, () => repo.advance(key, ctx)),
    );
    const designations = results.map((r) => r.lastDesignation).sort((a, b) => a - b);
    expect(designations[0]).toBeGreaterThanOrEqual(1);
    expect(designations[designations.length - 1]).toBe(100);
  });

  it("atomic simulator: 5000 parallel writes — no collision", async () => {
    const sim = new AtomicSequenceSimulator();
    const results = await Promise.all(Array.from({ length: 5000 }, () => sim.advance()));
    const unique = new Set(results);
    expect(unique.size).toBe(5000);
    expect(Math.min(...results)).toBe(1);
    expect(Math.max(...results)).toBe(5000);
  });
});

describe("stress — metadata persistence", () => {
  it("1000 sequential saves without corruption", async () => {
    const repo = new InMemoryMetadataRepository();
    for (let i = 0; i < 1000; i += 1) {
      const record = {
        id: `meta-${i}`,
        trackId: `track-${i}`,
        title: `Track ${i}`,
        isrc: null,
        durationSeconds: 180,
        language: null,
        explicit: false,
        genreIds: [],
        status: "draft",
        source: "system",
        visibility: "private",
        validationState: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      } as MetadataDomainRecord;
      await repo.save(record, ctx);
    }
    const all = await repo.search({}, ctx);
    expect(all.length).toBe(1000);
  });
});
