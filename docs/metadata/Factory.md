# Metadata Repository Factory

## Class

`MetadataRepositoryFactory` — `packages/persistence/src/factory/metadata-repository-factory.ts`

## Providers

```typescript
type PersistenceProviderKind = "memory" | "supabase" | "postgres" | "dynamo" | "mongo";
```

Phase 3 implements: `memory`, `supabase` (partial).

Future adapters plug in without engine changes.

## API

```typescript
// Default in-memory (tests, local dev)
MetadataRepositoryFactory.createInMemory();

// Production wiring (Phase 3.5+)
MetadataRepositoryFactory.create({
  provider: "supabase",
  supabaseClient: port,
  overrides: { /* optional test doubles */ },
});
```

## Strategy

- `memory` → full in-memory bundle
- `supabase` → replaces ISRC adapter; other repos remain in-memory until Phase 3.5
- Unknown provider → throws (fail fast)

## Open/Closed

Adding `postgres` adapter:

1. Implement `PostgresISRCRepositoryAdapter`
2. Add branch in factory
3. Zero changes to `@sonafrik/metadata`
