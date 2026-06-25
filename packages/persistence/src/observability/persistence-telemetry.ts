import type { PersistenceHealthStatus } from "@sonafrik/types";

export interface PersistenceMetricSample {
  readonly name: string;
  readonly value: number;
  readonly unit: "ms" | "count" | "bytes";
  readonly tags?: Readonly<Record<string, string>>;
  readonly recordedAt: string;
}

export interface PersistenceDiagnostics {
  readonly provider: string;
  readonly healthy: boolean;
  readonly latencyMs: number | null;
  readonly message: string | null;
  readonly checkedAt: string;
}

/** Observability hook — no MVP impact, prepare metrics/tracing */
export interface PersistenceTelemetry {
  recordMetric(sample: PersistenceMetricSample): void;
  recordHealth(status: PersistenceHealthStatus): void;
  recordError(code: string, message: string): void;
  getDiagnostics(): PersistenceDiagnostics | null;
}

export class NoOpPersistenceTelemetry implements PersistenceTelemetry {
  private lastHealth: PersistenceDiagnostics | null = null;

  recordMetric(_sample: PersistenceMetricSample): void {
    /* Phase 3.5: wire to Datadog/Sentry in packages/api */
  }

  recordHealth(status: PersistenceHealthStatus): void {
    this.lastHealth = {
      provider: status.provider,
      healthy: status.healthy,
      latencyMs: status.latencyMs,
      message: status.message,
      checkedAt: new Date().toISOString(),
    };
  }

  recordError(_code: string, _message: string): void {
    /* no-op */
  }

  getDiagnostics(): PersistenceDiagnostics | null {
    return this.lastHealth;
  }
}

export function createPersistenceTelemetry(): PersistenceTelemetry {
  return new NoOpPersistenceTelemetry();
}
