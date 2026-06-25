# Metadata Engine — Architecture

## Layer model

```
┌─────────────────────────────────────────────────────────┐
│  apps/web (Phase 2+) — NO direct metadata imports in P1  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  packages/api — future MetadataService adapter           │
│  (catalog.service bridges existing tracks/albums)        │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  @sonafrik/metadata                                      │
│  ┌─────────┐ ┌──────────────┐ ┌───────────┐ ┌────────┐ │
│  │  core   │ │  services    │ │ validators│ │ events │ │
│  └────┬────┘ └──────┬───────┘ └─────┬─────┘ └───┬────┘ │
│       │             │               │           │      │
│  ┌────▼─────────────▼───────────────▼───────────▼────┐  │
│  │         repositories (interfaces — engine only)    │  │
│  └──────────────────────────┬─────────────────────────┘  │
└─────────────────────────────┼────────────────────────────┘
                              │ Phase 3.5 wiring
┌─────────────────────────────▼────────────────────────────┐
│  @sonafrik/persistence (Phase 3 ✅)                        │
│  contracts → core → adapters (memory | supabase) → factory│
└─────────────────────────────┼────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────┐
│  @sonafrik/types/metadata — single source of truth types   │
└─────────────────────────────┼────────────────────────────┘
                              │ Phase 3.5 migrations
┌─────────────────────────────▼────────────────────────────┐
│  Supabase PostgreSQL (metadata_* tables — NOT yet live)   │
└────────────────────────────────────────────────────────────┘
```

## Module responsibilities

### `core/`

| Interface | Responsibility |
|---|---|
| `MetadataEngine` | Orchestrator entry point |
| `MetadataRegistry` | Resolve metadata by entity ID |
| `MetadataContext` | Actor, correlation ID, locale — defined in `@sonafrik/types/metadata/context` |
| `MetadataPipeline` | Sequential step execution contract |

### `repositories/`

| Interface | Responsibility |
|---|---|
| `MetadataRepository` | Persistence abstraction for all metadata domains |

No Supabase client in engine — implementations live in `@sonafrik/persistence` adapters (Phase 3). Wiring in `packages/api` deferred to Phase 3.5.

### `services/`

Facade interfaces grouping future business capabilities. Each service maps to a future phase (see Future-Roadmap.md).

### `validators/`

Validation contracts separated from generation and persistence (Single Responsibility).

### `generators/`

ISRC/UPC allocation contracts — Guinea (GN) prefix rules deferred to Phase 2.

### `events/`

Domain events for audit trail and async processing (Phase 3+).

### `errors/`

Typed error hierarchy for consistent API error mapping.

### `utils/`

Pure transformation contracts (format, normalize, parse, hash, compare).

## Domain model

Ten metadata domains prepared in `@sonafrik/types/metadata/domains.ts`:

1. Track Metadata
2. Album Metadata
3. Artist Metadata
4. Release Metadata
5. Royalty Metadata
6. Distribution Metadata
7. Fingerprint Metadata
8. Version Metadata
9. Audit Metadata
10. Storage Metadata

Each extends `MetadataRecordBase` with shared lifecycle fields (`status`, `source`, `validationState`, `version`).

Domain-specific workflow states use distinct property names (`distributionStatus`, `fingerprintStatus`, `bindingStatus`) — see [DECISIONS.md](./DECISIONS.md#adr-002--lifecycle-status-vs-domain-specific-status).

## Security principles

- Zero Trust: every operation requires `MetadataContext.actorId`
- RLS enforced at repository implementation layer (Phase 2), not in this package
- No service_role client usage
- No secrets in metadata package

## Dependency rules

```
@sonafrik/metadata     →  @sonafrik/types  ONLY
@sonafrik/persistence  →  @sonafrik/types  ONLY (adapters: optional supabase peer)
@sonafrik/api          →  @sonafrik/metadata + @sonafrik/persistence (Phase 3.5+)
apps/web               →  @sonafrik/api ONLY
```

No circular imports. No cross-feature imports in apps/web.

## Mapping to existing SONAFRIK tables (Phase 2 planning)

| Metadata domain | Existing table (read-only mapping) |
|---|---|
| TrackMetadata | `tracks`, `track_genres`, `track_credits` |
| AlbumMetadata | `albums`, `album_genres` |
| ArtistMetadata | `artist_profiles` |
| RoyaltyMetadata | `royalty_calculations` |
| StorageMetadata | `track_files` |
| AuditMetadata | `audit_logs` |

Phase 1 does not implement mapping — documented for Phase 2 adapters.
