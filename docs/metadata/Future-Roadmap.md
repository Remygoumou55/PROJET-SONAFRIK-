# Metadata Engine — Future Roadmap

> Phases 2–6 are **not started**. This document guides planning only.

## Phase 1 ✅ (current)

- Interfaces, types, errors, documentation
- Zero user impact, zero regression

## Phase 2 — Repository adapters & validation

**Goal:** Read existing catalog data through metadata lens without schema changes.

| Deliverable | Detail |
|---|---|
| `SupabaseMetadataRepository` | In `packages/api`, implements `MetadataRepository` |
| `MetadataServiceImpl` | Facade wired in `packages/api/metadata/` |
| `TrackValidator` / `AlbumValidator` | ISRC/UPC format validation (Zod) |
| `RegistryServiceImpl` | In-memory + DB lookup by ISRC/UPC |
| API bridge | `createMetadataService(supabase)` exported from `@sonafrik/api/metadata` |

**Non-goals:** UI changes, new tables, ISRC auto-generation.

## Phase 3 — Generation & fingerprint

| Deliverable | Detail |
|---|---|
| ISRC allocator | GN prefix, sequential registry table |
| UPC allocator | GS1-compatible check digit |
| Fingerprint worker | Edge Function or queue job |
| Duplicate detection | Compare fingerprint hashes |
| Events | Wire to `audit_logs` |

## Phase 4 — Royalty & distribution metadata

| Deliverable | Detail |
|---|---|
| `RoyaltyBindingService` impl | Map tracks → `royalty_calculations` |
| `DistributionService` impl | Delivery payload builder |
| `DeliveryMetadata` persistence | New table (with RLS) — migration required |
| Search metadata index | Meilisearch enrichment |

## Phase 5 — Versioning & audit

| Deliverable | Detail |
|---|---|
| `VersionMetadata` snapshots | On every metadata update |
| Rollback API | Admin-only |
| Full audit trail UI | Admin domain only |

## Phase 6 — Distribution partners

| Deliverable | Detail |
|---|---|
| Partner adapters | DDEX, proprietary CSV |
| Territory rules | CountryCode validation matrix |
| Delivery confirmation | Webhook ingestion |

## Dependencies between phases

```
Phase 1 (interfaces)
    ↓
Phase 2 (read + validate)
    ↓
Phase 3 (generate + fingerprint)
    ↓
Phase 4 (royalty + distribution)
    ↓
Phase 5 (versioning)
    ↓
Phase 6 (partners)
```

## MVP scope alignment

Per `MVP_SCOPE_LOCK.md`, metadata engine phases **do not block** MVP Core chain completion unless explicitly promoted by Rémy Goumou.

Current MVP blockers remain: Royalties UI, Retraits, Revenus analytics.

## Risk register

| Risk | Mitigation |
|---|---|
| ISRC authority compliance | Legal review before Phase 3 generation |
| Fingerprint API cost | Queue + batch, MVP scale < 1000 tracks |
| Schema migration drift | Adapter layer reads existing tables first |
| UI coupling | Strict packages/api gateway |

## Success criteria per phase

Each phase requires:

- `pnpm typecheck` + `pnpm lint` + `pnpm build` = 0 errors
- No regression on existing probes
- EXECUTION_LOG entry
- No MVP workflow modification without explicit approval
