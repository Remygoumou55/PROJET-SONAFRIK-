# Dependency Injection

## Container

`PersistenceContainer` in `packages/persistence/src/di/container.ts`.

### Tokens

```typescript
PERSISTENCE_TOKENS.REPOSITORIES
PERSISTENCE_TOKENS.TRANSACTION_MANAGER
PERSISTENCE_TOKENS.PROVIDER
```

### Construction

```typescript
import { createPersistenceContainer } from "@sonafrik/persistence";

const container = createPersistenceContainer({
  provider: "memory", // or "supabase" with supabaseClient port
});

const repos = container.getRepositories();
const tx = container.getTransactionManager();
```

## Rules

1. **Never** `new SupabaseClient()` inside `@sonafrik/metadata`
2. Client port is created in `packages/api` wiring layer (Phase 3.5+)
3. Override individual repos via `repositoryOverrides` for tests
4. Provider kind is opaque to the engine

## Test pattern

```typescript
const container = createPersistenceContainer({ provider: "memory" });
// or inject mock:
createPersistenceContainer({
  provider: "memory",
  repositoryOverrides: { isrc: mockIsrcRepo },
});
```
