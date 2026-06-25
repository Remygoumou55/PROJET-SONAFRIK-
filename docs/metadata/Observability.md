# Metadata Platform — Observability (Phase 3.5)

## Interface

`PersistenceTelemetry` in `@sonafrik/persistence`:

- `recordMetric(sample)` — latency, count, bytes
- `recordHealth(status)` — provider health probe results
- `recordError(code, message)` — normalized persistence errors
- `getDiagnostics()` — last health snapshot

## Default implementation

`NoOpPersistenceTelemetry` — zero MVP impact. Wiring to Sentry/Datadog deferred to `packages/api` Phase 4.

## Health probe

`SupabaseHealthProbe.checkHealth()` queries `metadata_platform_health` table.

Returns `PersistenceHealthStatus`:

```typescript
{ healthy: boolean; provider: string; latencyMs: number | null; message: string | null }
```

## Metrics prepared (not exported to UI)

| Metric | Unit |
|---|---|
| `persistence.query.latency` | ms |
| `persistence.transaction.duration` | ms |
| `persistence.batch.size` | count |
| `persistence.error.count` | count |

## Tracing

Correlation via `PersistenceContext.correlationId` — propagate to all adapter calls at wiring time.
