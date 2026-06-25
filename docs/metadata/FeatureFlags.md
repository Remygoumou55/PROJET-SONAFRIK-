# Publication Feature Flags — Phase 5

Progressive rollout for connecting `CatalogService` to `PublicationOrchestrator`.

**All flags default to `enabled = false`** — instant rollback to legacy RPC workflow.

## Flags

| Flag | DB name | Effect when enabled |
|---|---|---|
| Orchestrator | `publication_orchestrator_enabled` | `submitTrack` / `submitAlbum` route through `PublicationIntegrationService` |
| Metadata validation | `metadata_validation_enabled` | Pipeline runs `validate-metadata` + `validate-dependencies` |
| ISRC reservation | `isrc_reservation_enabled` | Real ISRC reserve (internal, never shown in UI) |
| Persistence | `publication_persistence_enabled` | Supabase persistence container + metadata resolve/create |
| Real publish | `publication_real_publish_enabled` | Legacy submit runs inside `catalog-submit` step only (no duplicate call) |

## Rollout order (recommended)

```
1. publication_orchestrator_enabled     → dry-run + legacy submit (UX unchanged)
2. metadata_validation_enabled
3. publication_persistence_enabled
4. isrc_reservation_enabled
5. publication_real_publish_enabled     → legacy inside pipeline only
```

## Rollback

Disable `publication_orchestrator_enabled` (or any subset) in `feature_flags` table — next submit uses legacy RPC immediately.

## Code entry points

- Resolver: `packages/api/src/publication/integration/feature-flags.ts`
- Bridge: `packages/api/src/publication/integration/publication-integration.service.ts`
- Catalog wiring: `packages/api/src/catalog/catalog.service.ts` (`submitTrack`, `submitAlbum`)

## Migration

`supabase/migrations/20260625120000_publication_orchestrator_feature_flags.sql`
