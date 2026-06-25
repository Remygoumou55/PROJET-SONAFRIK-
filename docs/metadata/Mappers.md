# Mappers — Metadata Application Layer

## Fichiers

- `mappers/metadata.mapper.ts` — `MetadataDomainRecord` → DTO
- `mappers/isrc.mapper.ts` — `ISRCRegistryEntry` → `ISRCReservationDto`

## Flux

```
Persistence record (domain)
        ↓ toMetadataRecordDto
MetadataRecordDto (application)
        ↓ (futur Phase 4.5)
Presentation / API response
```

## Inférence entityType

Ordre de priorité (évite collisions trackId/fingerprintId, distributionId/deliveryId) :

1. fingerprint (`fingerprintId` + `hash`)
2. distribution (`distributionStatus`)
3. delivery (`partnerCode` + `payloadFormat`)
4. track, album, artist, release, royalty, version, audit, storage
5. `unknown` fallback

## Tests

`metadata.mapper.test.ts` — 12 cas couvrant tous les types domaine.
