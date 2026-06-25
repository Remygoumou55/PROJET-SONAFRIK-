# Use Cases — Metadata Application Layer

Chaque use case est **atomique** et indépendant. Orchestration via `MetadataApplicationService`.

## Commands (mutation)

| Use Case | Fichier | Description |
|---|---|---|
| CreateMetadata | `metadata-command.use-cases.ts` | Valide input → domain record → save → `MetadataCreated` |
| UpdateMetadata | `metadata-command.use-cases.ts` | Incrémente version → save |
| ValidateMetadata | `metadata-command.use-cases.ts` | Passe status `validated`, validationState `passed` |
| ArchiveMetadata | `metadata-command.use-cases.ts` | Archive + `MetadataArchived` |
| RestoreMetadata | `metadata-command.use-cases.ts` | Restore version snapshot + `MetadataRestored` |
| ReserveISRC | `isrc-command.use-cases.ts` | Admin only — ISRC explicite, pas d'auto-génération |
| ReleaseISRC | `isrc-command.use-cases.ts` | Admin only — libère réservation |

## Queries (lecture)

| Use Case | Fichier | Description |
|---|---|---|
| FindMetadata | `metadata-query.use-cases.ts` | Par entityType + entityId |
| SearchMetadata | `metadata-query.use-cases.ts` | Filtre paginé → `MetadataSearchResultDto` |
| GetMetadataById | `metadata-query.use-cases.ts` | Par metadataId |
| GetMetadataStatus | `metadata-query.use-cases.ts` | Status léger sans payload complet |

## Dépendances autorisées

Use cases → ports, validators, mappers, errors, events, persistence repositories.

**Interdit** : import React, Next.js, `@sonafrik/metadata` engine direct.
