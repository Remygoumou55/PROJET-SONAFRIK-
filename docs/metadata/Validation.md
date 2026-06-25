# Validation — Metadata Application Layer

## Schémas Zod

`validators/metadata.schemas.ts` — alignés sur les enums `@sonafrik/types` :

- `status` : draft | ready | validated | published | archived | deleted
- `source` : manual | generated | imported | migrated
- `visibility` : private | internal | public
- `validationState` : pending | passed | failed | skipped
- `isrcValueSchema` : regex ISRC `^[A-Z]{2}[A-Z0-9]{3}\d{2}\d{5}$`

## Validateur application

`validators/metadata-application.validator.ts` :

- `validateMetadataInput()` — lève `ValidationFailedError`
- `validateSearchInput()` — pagination max 100
- `validateISRCValue()` — format ISRC strict
- `inputToDomainRecord()` — branded IDs (`TrackID`, `AlbumID`, `MetadataID`)
- `assertValidatable()` — refuse archivés

## Indépendance UI

Aucune dépendance React. Validation exécutable côté serveur, tests, edge functions futures.
