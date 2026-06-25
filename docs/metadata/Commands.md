# Commands — Metadata CQRS

Les **Commands** modifient l'état. Définies dans `packages/api/src/metadata/application/commands/metadata.commands.ts`.

| Command | Payload |
|---|---|
| `CreateMetadata` | `MetadataRecordInput` (Zod-validated) |
| `UpdateMetadata` | `MetadataRecordInput` |
| `ValidateMetadata` | `{ metadataId: string }` |
| `ReserveISRC` | `{ isrc: string }` — valeur explicite |
| `ReleaseISRC` | `{ isrc: string }` |
| `ArchiveMetadata` | `{ metadataId: string }` |
| `RestoreMetadata` | `{ versionId: string }` |

## Exécution

```typescript
await service.executeCommand(ctx, {
  type: "CreateMetadata",
  payload: { /* MetadataRecordInput */ },
});
```

Aucune query ne doit être mélangée dans un command handler.
