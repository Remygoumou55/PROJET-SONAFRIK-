# Metadata Platform — RLS Certification (Phase 3.5)

Migration: `supabase/migrations/20260624220000_metadata_platform_infrastructure.sql`

## Certified tables (10/10 RLS enabled)

- `metadata_platform_health`
- `metadata_records`
- `metadata_isrc_registry`
- `metadata_isrc_sequence`
- `metadata_upc_registry`
- `metadata_registry_index`
- `metadata_audit_log`
- `metadata_version_snapshots`
- `metadata_release_records`
- `metadata_fingerprint_records`

## Validation query

```sql
SELECT c.relname AS tablename, c.relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname LIKE 'metadata_%'
ORDER BY c.relname;
```

All rows must show `relrowsecurity = true`.

## Automated certification

`packages/persistence/src/infra/migration-rls.test.ts` validates migration SQL structure offline.

## Non-destructive guarantee

Migration uses `CREATE TABLE IF NOT EXISTS` only — no DROP, no ALTER on existing business tables.
