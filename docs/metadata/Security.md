# Metadata Platform — Security (Phase 3.5)

## Zero Trust model

Every persistence operation requires `PersistenceContext` with `actorId` and `correlationId`.

## RLS matrix

| Table | Creator | Listener | Admin | Service Role |
|---|---|---|---|---|
| `metadata_isrc_registry` | ❌ | ❌ | ✅ | ✅ (bypass) |
| `metadata_isrc_sequence` | ❌ | ❌ | ✅ | ✅ |
| `metadata_upc_registry` | ❌ | ❌ | ✅ | ✅ |
| `metadata_registry_index` | ❌ | ❌ | ✅ | ✅ |
| `metadata_records` | ✅ own | ❌ | ✅ | ✅ |
| `metadata_audit_log` | ✅ append own | ❌ | ✅ read | ✅ |
| `metadata_version_snapshots` | ✅ own | ❌ | ✅ | ✅ |
| `metadata_release_records` | ✅ own | ❌ | ✅ | ✅ |
| `metadata_fingerprint_records` | ✅ track owner | ❌ | ✅ | ✅ |

## ISRC invisibility

ISRC registries are **admin-only**. No creator or listener policy exists — ISRC remains invisible to end users.

## Audit append-only

`metadata_audit_log` has INSERT + SELECT policies only. No UPDATE/DELETE policies — immutable trail.

## RPC security

Atomic functions (`metadata_advance_isrc_sequence`, `metadata_reserve_isrc`, `metadata_reserve_upc`) are `SECURITY DEFINER` with fixed `search_path = public`.

## Error normalization

Vendor errors never reach `@sonafrik/metadata` — mapped via `mapVendorError()`.

## Secrets

No service_role key in `@sonafrik/persistence`. Client port injected at wiring layer only.
