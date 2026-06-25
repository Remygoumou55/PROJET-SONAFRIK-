# Application Layer — Metadata Platform Phase 4

## Position dans la stack

```
apps/web | apps/mobile  (interdit d'appeler persistence/metadata directement)
        ↓
packages/api/metadata  ← MetadataApplicationService (seule porte d'entrée)
        ↓
@sonafrik/persistence  (repositories, transactions)
        ↓
Supabase / memory adapters
```

`@sonafrik/metadata` (Metadata Engine) reste indépendant — non importé par l'Application Layer en Phase 4.

## Structure

```
packages/api/src/metadata/application/
├── commands/       # CQRS — mutations
├── queries/        # CQRS — lecture seule
├── use-cases/      # orchestration atomique
├── dto/            # contrats de sortie
├── mappers/        # Entity ↔ DTO
├── validators/     # Zod + règles métier
├── events/         # événements domaine application
├── ports/          # contexte, publisher, abstractions
├── errors/         # ApplicationError (jamais PersistenceError exposé)
└── services/       # MetadataApplicationService facade
```

## Point d'entrée

```typescript
import { createMetadataApplicationService } from "@sonafrik/api/metadata";

const service = createMetadataApplicationService(persistenceContainer);
await service.executeCommand(ctx, { type: "CreateMetadata", payload });
await service.executeQuery(ctx, { type: "GetMetadataById", metadataId });
```

## Sécurité (Zero Trust)

- `ApplicationContext.actorId` obligatoire sur chaque opération
- `ReserveISRC` / `ReleaseISRC` : `ctx.isAdmin === true`
- Aucune génération automatique d'ISRC
- Erreurs persistence mappées via `mapPersistenceToApplication()`

## Tests

- 33 tests unitaires/intégration
- Couverture `src/metadata/**` : **≥ 95 %** (lignes/statements)
