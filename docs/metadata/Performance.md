# Metadata Platform — Performance (Phase 3.5)

## Index strategy

| Table | Index | Purpose |
|---|---|---|
| `metadata_records` | `(entity_type, entity_id)` UNIQUE | O(1) domain lookup |
| `metadata_records` | `creator_id`, `status`, `updated_at` | Creator dashboard queries |
| `metadata_isrc_registry` | `status` | Available ISRC pool |
| `metadata_fingerprint_records` | `hash` UNIQUE partial | Duplicate detection |
| `metadata_audit_log` | `created_at DESC` | Audit trail pagination |

## Batch / stream interfaces

Prepared in `PersistenceBatchWriter` and `PersistenceStreamLoader` — not wired until scale requires.

## Concurrency targets (certified via tests)

| Scenario | Result |
|---|---|
| 100 parallel sequence advances (in-memory) | ✅ |
| 5000 atomic simulated writes | ✅ No collision |
| 1000 sequential metadata saves | ✅ |

## Latency expectations (single-row ops)

| Operation | Target |
|---|---|
| findById | < 50ms p95 |
| save/upsert | < 100ms p95 |
| RPC advance | < 30ms p95 |

Measured at wiring time via `PersistenceTelemetry.recordMetric()`.

## Scale readiness

JSONB payload design supports millions of records with indexed hot columns. Partitioning deferred post-100k tracks if needed.
