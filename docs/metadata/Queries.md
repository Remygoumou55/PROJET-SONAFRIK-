# Queries — Metadata CQRS

Les **Queries** sont en lecture seule. Définies dans `packages/api/src/metadata/application/queries/metadata.queries.ts`.

| Query | Paramètres |
|---|---|
| `FindMetadata` | `entityType`, `entityId` |
| `SearchMetadata` | `filter: SearchMetadataInput` |
| `GetMetadataById` | `metadataId` |
| `GetMetadataStatus` | `metadataId` |

## Exécution

```typescript
const record = await service.executeQuery(ctx, {
  type: "GetMetadataById",
  metadataId: "...",
});
```

Retour toujours typé en DTO — jamais `MetadataDomainRecord` brut.
