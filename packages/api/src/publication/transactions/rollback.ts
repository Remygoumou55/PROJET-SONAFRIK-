import type { PublicationPipelineStepHandler } from "../pipeline";
import type { PublicationTransaction } from "./publication-transaction";

export async function executeWithRollback<T>(
  transaction: PublicationTransaction,
  step: PublicationPipelineStepHandler,
  execute: () => Promise<T>,
  rollback: () => Promise<void>,
): Promise<T> {
  return transaction.runStep(step, execute, rollback);
}
