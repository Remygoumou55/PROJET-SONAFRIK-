import { describe, expect, it } from "vitest";
import { InMemoryUPCRepository } from "./in-memory-upc.repository";
import type { PersistenceContext } from "@sonafrik/types";
import { DuplicateError, NotFoundError } from "../../errors/persistence-errors";

const ctx: PersistenceContext = {
  actorId: "actor",
  correlationId: "corr",
  initiatedAt: new Date().toISOString(),
};

describe("InMemoryUPCRepository", () => {
  it("save, find, reserve, release, search", async () => {
    const repo = new InMemoryUPCRepository();
    const entry = {
      upc: "012345678905",
      status: "available" as const,
      metadataId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repo.saveEntry(entry, ctx);
    expect(await repo.exists(entry.upc, ctx)).toBe(true);
    await repo.reserve(entry.upc, "actor", ctx);
    await repo.release(entry.upc, ctx);
    expect((await repo.search({ status: "available" }, ctx)).length).toBe(1);
    await expect(repo.saveEntry(entry, ctx)).rejects.toBeInstanceOf(DuplicateError);
    await expect(repo.reserve("missing", "actor", ctx)).rejects.toBeInstanceOf(NotFoundError);
  });
});
