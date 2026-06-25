# Supabase Adapter

## Port pattern

`SupabaseClientPort` duck-types Supabase query builder without importing `@supabase/supabase-js` in the engine or contracts.

```typescript
interface SupabaseClientPort {
  from(table: string): SupabaseQueryBuilderPort;
}
```

Wrap real client:

```typescript
import { createSupabaseClientPort } from "@sonafrik/persistence/adapters/supabase";
const port = createSupabaseClientPort(supabase);
```

## Adapters (Phase 3.5 — complete)

| Adapter | Table | Status |
|---|---|---|
| `SupabaseMetadataRepositoryAdapter` | `metadata_records` | ✅ |
| `SupabaseISRCRepositoryAdapter` | `metadata_isrc_registry` | ✅ |
| `SupabaseISRCSequenceRepositoryAdapter` | `metadata_isrc_sequence` | ✅ |
| `SupabaseUPCRepositoryAdapter` | `metadata_upc_registry` | ✅ |
| `SupabaseRegistryRepositoryAdapter` | `metadata_registry_index` | ✅ |
| `SupabaseAuditRepositoryAdapter` | `metadata_audit_log` | ✅ |
| `SupabaseVersionRepositoryAdapter` | `metadata_version_snapshots` | ✅ |
| `SupabaseReleaseRepositoryAdapter` | `metadata_release_records` | ✅ |
| `SupabaseFingerprintRepositoryAdapter` | `metadata_fingerprint_records` | ✅ |

## Translation only

Adapters:

- Map rows ↔ domain types (`rowToEntry`, `entryToRow`)
- Call `mapVendorError()` on failures
- **No** business logic (reserve rules stay in ISRC engine)

## Health probe

`SupabaseHealthProbe.checkHealth()` returns `PersistenceHealthStatus` without leaking vendor errors.

## Not ready state

If tables are missing, `mapVendorError` returns `PersistenceNotReadyError` — expected until Phase 3.5 migrations run.
