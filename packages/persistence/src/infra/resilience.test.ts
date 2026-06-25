import { describe, expect, it } from "vitest";
import { StorageError, TimeoutError, mapVendorError } from "../errors/persistence-errors";
import { InMemoryTransactionManager } from "../core/transaction-manager";
import { MetadataRepositoryFactory } from "../factory/metadata-repository-factory";

describe("resilience — normalized errors", () => {
  it("maps connection lost to StorageError", () => {
    expect(mapVendorError(new Error("connection lost"))).toBeInstanceOf(StorageError);
  });

  it("maps constraint violations", () => {
    expect(mapVendorError(new Error("foreign key constraint 23503"))).toBeDefined();
  });

  it("transaction timeout returns TimeoutError", async () => {
    const tx = new InMemoryTransactionManager();
    const ctx = { actorId: "a", correlationId: "c", initiatedAt: new Date().toISOString() };
    await expect(
      tx.runInTransaction(
        () => new Promise<number>((r) => setTimeout(() => r(1), 30)),
        ctx,
        { timeoutMs: 1 },
      ),
    ).rejects.toBeInstanceOf(TimeoutError);
  });

  it("in-memory bundle survives adapter swap via factory overrides", () => {
    const bundle = MetadataRepositoryFactory.create({
      provider: "memory",
      overrides: { isrc: MetadataRepositoryFactory.createInMemory().isrc },
    });
    expect(bundle.isrc).toBeDefined();
  });
});
