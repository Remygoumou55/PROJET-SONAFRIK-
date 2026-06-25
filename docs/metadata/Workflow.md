# Publication Workflow — Phase 5

## Architecture

```
UI (unchanged)
  → CatalogService.submitTrack / submitAlbum
    → PublicationIntegrationService (if flag on)
      → PublicationOrchestrator.preparePublication
        → MetadataApplicationService
        → Persistence (memory or Supabase per flag)
    → legacy RPC (submit_track_for_review / submit_album_for_review)
```

See [FeatureFlags.md](./FeatureFlags.md) for progressive rollout.

## Pipeline steps (flag-aware)

```
1. verify-context
2. resolve-metadata          (create/find when persistence flag on)
3. validate-metadata         (when metadata_validation flag on)
4. isrc-reservation          (simulate or real per isrc flag)
5. build-publication-package
6. validate-dependencies
7. prepare-persistence
8. catalog-submit            (legacy RPC when real_publish flag on)
```

Constants: `PUBLICATION_WORKFLOW_STEPS` in `workflow/publication-workflow.ts`.

## Behaviour by flag state

| Orchestrator | Real publish | Legacy submit |
|---|---|---|
| off | — | Once (direct) |
| on | off | After orchestrator (dry-run path) |
| on | on | Inside `catalog-submit` step only |

## Events emitted

1. `PublicationRequested`
2. `PublicationValidated` (after metadata step when validation enabled)
3. `PublicationPrepared`
4. `PublicationReady` (success)
5. `PublicationCancelled` (failure)

## Future hooks

`FUTURE_PIPELINE_HOOKS` : `upc`, `fingerprint`, `distribution`, `royalties`, `audit`

Add via `extraSteps` on orchestrator constructor without changing core flow.
