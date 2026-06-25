# Application Events — Metadata Platform Phase 4

Événements **métier application** — pas d'événements UI.

Fichier : `events/metadata-application.events.ts`

| Event | Déclenché par |
|---|---|
| `MetadataCreated` | CreateMetadata |
| `MetadataValidated` | ValidateMetadata |
| `MetadataReserved` | ReserveISRC (admin) |
| `MetadataArchived` | ArchiveMetadata |
| `MetadataReleased` | ReleaseISRC (admin) |
| `MetadataRestored` | RestoreMetadata |

## Publisher

`InMemoryApplicationEventPublisher` pour tests. Interface `ApplicationEventPublisher` pour injection future (bus, audit).

```typescript
interface MetadataApplicationEvent {
  type: MetadataApplicationEventType;
  actorId: string;
  correlationId: string;
  metadataId?: string;
  isrc?: string;
  occurredAt: string;
}
```

Aucun événement ne déclenche de workflow publication en Phase 4.
