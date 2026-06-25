# Metadata Platform — Infrastructure (Phase 3.5)

## Package

`@sonafrik/persistence` v0.2.0

## Live infrastructure

| Component | Status |
|---|---|
| PostgreSQL tables `metadata_*` | ✅ Migrated |
| RLS policies | ✅ 10/10 tables |
| Atomic RPCs (sequence, reserve) | ✅ |
| Supabase adapters (9 repos) | ✅ Complete |
| Factory full supabase bundle | ✅ |
| Observability hooks | ✅ NoOp telemetry |
| Metadata Engine coupling | ❌ None (by design) |
| MVP workflow connection | ❌ None (Phase 4) |

## Adapter inventory

| Adapter | Table |
|---|---|
| `SupabaseMetadataRepositoryAdapter` | `metadata_records` |
| `SupabaseISRCRepositoryAdapter` | `metadata_isrc_registry` |
| `SupabaseISRCSequenceRepositoryAdapter` | `metadata_isrc_sequence` |
| `SupabaseUPCRepositoryAdapter` | `metadata_upc_registry` |
| `SupabaseRegistryRepositoryAdapter` | `metadata_registry_index` |
| `SupabaseAuditRepositoryAdapter` | `metadata_audit_log` |
| `SupabaseVersionRepositoryAdapter` | `metadata_version_snapshots` |
| `SupabaseReleaseRepositoryAdapter` | `metadata_release_records` |
| `SupabaseFingerprintRepositoryAdapter` | `metadata_fingerprint_records` |

## Concurrency

PostgreSQL `metadata_advance_isrc_sequence` uses `INSERT ... ON CONFLICT DO UPDATE` for atomic increments.

`metadata_reserve_isrc` / `metadata_reserve_upc` use conditional `UPDATE ... WHERE status = 'available'`.

## Next phase

Phase 4: wire `packages/api` + publication workflow (after explicit certification).
