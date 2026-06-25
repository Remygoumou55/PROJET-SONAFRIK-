# Publication Orchestrator — Phase 4.5 → 5

## Position

```
apps/web (UI inchangée — Phase 5)
        ↓
CatalogService.submitTrack / submitAlbum
        ↓
PublicationIntegrationService (feature flags)
        ↓
@sonafrik/api/publication  ← PublicationOrchestrator (seul coordinateur)
        ↓
@sonafrik/api/metadata     ← MetadataApplicationService
        ↓
@sonafrik/persistence
        ↓
Supabase
```

## Responsabilités

| Méthode | Rôle |
|---|---|
| `preparePublication(ctx, request, config, legacySubmit?)` | Pipeline flag-driven (dry-run → real publish) |
| `getPipelineSteps()` | Liste des étapes actives |

L'orchestrateur **ne contient pas** la logique métier détaillée — il coordonne le pipeline.

## Mode Phase 5

- **Feature flags** — rollout progressif, rollback instantané (voir `FeatureFlags.md`)
- **ISRC** — simulation par défaut ; réservation réelle si `isrc_reservation_enabled`
- **Legacy submit** — conservé tant que `publication_real_publish_enabled` est off

## Mode Phase 4.5 (historique)

- **dry-run obligatoire** — `writes: []` dans le plan de persistance
- **ISRC simulé** — aucun appel `ReserveISRC`
- **Aucune publication réelle**
- **Invisible utilisateur** — non connecté à `apps/web`

## Factories

```typescript
import { createInMemoryPublicationOrchestrator } from "@sonafrik/api/publication";

const orchestrator = createInMemoryPublicationOrchestrator();
await orchestrator.preparePublication(ctx, { trackId, metadataId, creatorId });
```

## Sécurité

- `actorId` obligatoire
- Ownership : `creatorId === actorId` (sauf admin)
- Idempotence via `idempotencyKey`
