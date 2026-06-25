import type { PersistenceContext } from "@sonafrik/types";
import type { PersistenceTransaction, TransactionOptions } from "../core/persistence-store";
import { TransactionError, TimeoutError, mapVendorError } from "../errors/persistence-errors";

export class InMemoryTransaction implements PersistenceTransaction {
  private committed = false;
  private rolledBack = false;

  async commit(): Promise<void> {
    if (this.rolledBack) throw new TransactionError("Transaction déjà annulée");
    this.committed = true;
  }

  async rollback(): Promise<void> {
    if (this.committed) throw new TransactionError("Transaction déjà commitée");
    this.rolledBack = true;
  }

  get isCommitted(): boolean {
    return this.committed;
  }
}

/** In-memory transaction manager with retry + timeout simulation */
export class InMemoryTransactionManager {
  async runInTransaction<T>(
    fn: (tx: PersistenceTransaction) => Promise<T>,
    _context: PersistenceContext,
    options: TransactionOptions = {},
  ): Promise<T> {
    const timeoutMs = options.timeoutMs ?? 5000;
    const maxRetries = options.maxRetries ?? 0;
    let attempt = 0;

    while (true) {
      const tx = new InMemoryTransaction();
      try {
        const result = await Promise.race([
          fn(tx),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new TimeoutError()), timeoutMs),
          ),
        ]);
        await tx.commit();
        return result;
      } catch (error) {
        await tx.rollback();
        attempt += 1;
        if (attempt > maxRetries) {
          throw mapVendorError(error);
        }
      }
    }
  }
}
