import { describe, expect, it } from "vitest";
import { InMemoryTransactionManager } from "../core/transaction-manager";
import { TimeoutError, TransactionError } from "../errors/persistence-errors";

const ctx = { actorId: "a", correlationId: "c", initiatedAt: new Date().toISOString() };

describe("InMemoryTransactionManager", () => {
  it("retries on failure when maxRetries > 0", async () => {
    const tx = new InMemoryTransactionManager();
    let attempts = 0;
    const result = await tx.runInTransaction(
      async () => {
        attempts += 1;
        if (attempts < 2) throw new Error("transient");
        return "ok";
      },
      ctx,
      { maxRetries: 2 },
    );
    expect(result).toBe("ok");
    expect(attempts).toBe(2);
  });

  it("throws TimeoutError when fn exceeds timeout", async () => {
    const tx = new InMemoryTransactionManager();
    await expect(
      tx.runInTransaction(
        () => new Promise<string>((resolve) => setTimeout(() => resolve("late"), 50)),
        ctx,
        { timeoutMs: 1 },
      ),
    ).rejects.toBeInstanceOf(TimeoutError);
  });

  it("prevents double commit/rollback on transaction handle", async () => {
    const tx = new InMemoryTransactionManager();
    await tx.runInTransaction(async (handle) => {
      await handle.commit();
      await expect(handle.rollback()).rejects.toBeInstanceOf(TransactionError);
    }, ctx);
  });
});
