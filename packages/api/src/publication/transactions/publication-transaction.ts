import { RollbackFailedError } from "../errors";
import type { PublicationPipelineStepHandler } from "../pipeline";

interface Compensation {
  readonly stepId: string;
  readonly rollback: () => Promise<void>;
}

/** Business transaction — saga-style compensations, no partial state */
export class PublicationTransaction {
  private readonly compensations: Compensation[] = [];

  async runStep<T>(
    step: PublicationPipelineStepHandler,
    execute: () => Promise<T>,
    rollback: () => Promise<void>,
  ): Promise<T> {
    try {
      const result = await execute();
      this.compensations.unshift({ stepId: step.stepId, rollback });
      return result;
    } catch (error) {
      await this.rollbackAll();
      throw error;
    }
  }

  async rollbackAll(): Promise<void> {
    const failures: string[] = [];
    for (const compensation of this.compensations) {
      try {
        await compensation.rollback();
      } catch {
        failures.push(compensation.stepId);
      }
    }
    this.compensations.length = 0;
    if (failures.length > 0) {
      throw new RollbackFailedError(`Rollback partiel: ${failures.join(", ")}`);
    }
  }

  getCompensationCount(): number {
    return this.compensations.length;
  }
}
