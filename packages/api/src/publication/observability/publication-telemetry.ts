export interface PublicationMetricSnapshot {
  readonly executions: number;
  readonly successes: number;
  readonly failures: number;
  readonly rollbacks: number;
  readonly totalDurationMs: number;
  readonly flagChecks: number;
}

/** In-process publication workflow metrics — Phase 5 */
export class PublicationTelemetry {
  private executions = 0;
  private successes = 0;
  private failures = 0;
  private rollbacks = 0;
  private totalDurationMs = 0;
  private flagChecks = 0;

  recordFlagCheck(): void {
    this.flagChecks += 1;
  }

  recordStart(): void {
    this.executions += 1;
  }

  recordSuccess(durationMs: number): void {
    this.successes += 1;
    this.totalDurationMs += durationMs;
  }

  recordFailure(durationMs: number): void {
    this.failures += 1;
    this.totalDurationMs += durationMs;
  }

  recordRollback(): void {
    this.rollbacks += 1;
  }

  snapshot(): PublicationMetricSnapshot {
    return {
      executions: this.executions,
      successes: this.successes,
      failures: this.failures,
      rollbacks: this.rollbacks,
      totalDurationMs: this.totalDurationMs,
      flagChecks: this.flagChecks,
    };
  }
}

let globalTelemetry: PublicationTelemetry | null = null;

export function getPublicationTelemetry(): PublicationTelemetry {
  if (!globalTelemetry) globalTelemetry = new PublicationTelemetry();
  return globalTelemetry;
}

export function resetPublicationTelemetry(): void {
  globalTelemetry = new PublicationTelemetry();
}
