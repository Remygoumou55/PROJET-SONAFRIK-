# Metadata Persistence Layer — Phase 3

## Package

`@sonafrik/persistence` v0.1.0 — enterprise persistence layer for the Metadata Engine.

## Principle

The Metadata Engine (`@sonafrik/metadata`) **never** imports Supabase, PostgreSQL, or any storage technology. It will depend only on repository contracts injected at wiring time (Phase 3.5+).

## Layer stack

```
@sonafrik/metadata
        ↓ (future Phase 3.5)
Repository Contracts (@sonafrik/persistence/contracts)
        ↓
Persistence Core (transactions, batch, stream interfaces)
        ↓
Repository Adapters (memory | supabase | future)
        ↓
Database (Phase 3.5 migrations)
```

## Exports

| Subpath | Purpose |
|---|---|
| `@sonafrik/persistence` | Factory, DI, errors, core |
| `@sonafrik/persistence/contracts` | Repository interfaces only |
| `@sonafrik/persistence/adapters/memory` | In-memory adapters for tests |
| `@sonafrik/persistence/adapters/supabase` | Supabase translation adapters |

## Phase 3 scope

- Contracts, adapters, factory, DI, error mapping, transaction abstractions
- **No** UI, workflow, migrations, or public API changes
- **No** automatic ISRC assignment

## Phase 3.5 (certified)

- SQL migrations for `metadata_*` tables — **live**
- Full Supabase adapter bundle (9 repositories)
- Atomic RPCs: `metadata_advance_isrc_sequence`, `metadata_reserve_isrc/upc`
- RLS Zero Trust — 10/10 tables
- Observability hooks (`PersistenceTelemetry`)

## Phase 4 (next)

- Wire factory in `packages/api`
- Connect ISRC engine registry to persistence
- Publication workflow (after explicit Phase 4 certification)
