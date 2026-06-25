# DTO — Metadata Application Layer

Fichier : `packages/api/src/metadata/application/dto/metadata.dto.ts`

Les DTO isolent la couche présentation du domaine persistence.

## Types

| DTO | Usage |
|---|---|
| `MetadataRecordDto` | Enregistrement metadata complet (sans champs engine internes) |
| `MetadataStatusDto` | Status + validationState + version |
| `MetadataSearchResultDto` | `{ items, total }` |
| `ISRCReservationDto` | Réservation ISRC (admin) — sans exposition UI Phase 4 |

## Règle

> Aucune entité du moteur (`MetadataDomainRecord`, `ISRCRegistryEntry`) ne sort directement des use cases.

Mapping via `toMetadataRecordDto()`, `toMetadataStatusDto()`, `toISRCReservationDto()`.
