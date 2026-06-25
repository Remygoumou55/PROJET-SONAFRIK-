# Repository Contracts

All contracts live in `packages/persistence/src/contracts/`. They depend only on `@sonafrik/types`.

## Contracts

| Interface | Responsibility |
|---|---|
| `MetadataPersistenceRepository` | Domain metadata records (track, album, …) |
| `ISRCPersistenceRepository` | ISRC registry entries — save, reserve, release, archive |
| `ISRCSequencePersistenceRepository` | Sequence counters per prefix/year |
| `UPCPersistenceRepository` | UPC registry |
| `FingerprintPersistenceRepository` | Audio fingerprint metadata |
| `AuditPersistenceRepository` | Audit trail entries |
| `VersionPersistenceRepository` | Optimistic versioning |
| `RegistryPersistenceRepository` | Cross-identifier index (ISRC ↔ metadataId) |
| `ReleasePersistenceRepository` | Release metadata |

## Aggregate

`MetadataRepositoryBundle` groups all repositories for dependency injection.

## Context

Every operation receives `PersistenceContext`:

```typescript
interface PersistenceContext {
  readonly actorId: string;
  readonly correlationId: string;
  readonly initiatedAt: string;
}
```

Zero Trust: adapters must not bypass actor/correlation propagation.

## Dependency Inversion

- Engine → interface
- Adapter → implements interface
- Factory → selects adapter by `PersistenceProviderKind`
