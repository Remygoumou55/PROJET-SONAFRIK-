# SONAFRIK Metadata Engine

> Phase 1 — Foundations (interfaces only)  
> Phase 1.5 — **Certified** (2026-06-24)  
> Phase 2 / 2.5 — ISRC Engine **Certified** (headless)  
> Phase 3 — Persistence Layer **Certified** (2026-06-24)  
> Phase 3.5 — Infrastructure Readiness **Certified** (2026-06-24)

## Mission

The Metadata Engine is SONAFRIK's future backbone for professional music metadata management:

- ISRC / UPC generation
- Audio fingerprinting and duplicate detection
- Distribution and delivery metadata
- Royalty mapping
- Validation, versioning, and audit trails

**Phase 1 builds zero runtime behavior.** It establishes contracts so future phases can extend without modifying existing catalog, wallet, or streaming modules.

## Package location

| Package | Role |
|---|---|
| `@sonafrik/types` (`metadata/*`) | Branded IDs, enums, domain records, pipeline & event types |
| `@sonafrik/metadata` | Engine: core, ISRC, validators, services (interfaces + ISRC impl) |
| `@sonafrik/persistence` | Repository contracts, adapters, factory, DI (Phase 3) |

## Integration rule (non-negotiable)

```
React components  →  packages/api  →  @sonafrik/metadata
                         ↑
                   never direct UI import
```

## Phase 1 deliverables

- Core interfaces: `MetadataEngine`, `MetadataRegistry`, `MetadataPipeline`, `MetadataContext`
- Repository abstraction: `MetadataRepository`
- Service contracts: `MetadataService`, `ValidationService`, `RegistryService`, `GeneratorService`, `FingerprintService`, `RoyaltyBindingService`, `DistributionService`
- Validator contracts: track/album/release + field validators (ISRC, UPC, country, language, genre, fingerprint)
- Error hierarchy: `MetadataError` and specialized errors
- Utils contracts: formatter, normalizer, parser, hasher, comparator
- Event contracts: domain events + pipeline events

## What Phase 1 does NOT do

- No database migrations
- No API routes or Edge Functions
- No UI changes
- No modification of track/album creation workflows
- No Supabase coupling inside `@sonafrik/metadata`

## Documentation

- [Architecture.md](./Architecture.md) — layer diagram and responsibilities
- [Persistence.md](./Persistence.md) — `@sonafrik/persistence` overview
- [Repository.md](./Repository.md) — repository contracts
- [Transactions.md](./Transactions.md) — transaction abstractions
- [DependencyInjection.md](./DependencyInjection.md) — container & tokens
- [SupabaseAdapter.md](./SupabaseAdapter.md) — Supabase port & adapters
- [Factory.md](./Factory.md) — MetadataRepositoryFactory
- [ErrorMapping.md](./ErrorMapping.md) — normalized error hierarchy
- [DECISIONS.md](./DECISIONS.md) — locked ADRs (status fields, registry split, type ownership)
- [Pipeline.md](./Pipeline.md) — pipeline step model
- [Future-Roadmap.md](./Future-Roadmap.md) — phases 2–6

## Conventions

- Strict TypeScript, no `any`
- Types live in `@sonafrik/types/metadata`
- Implementations arrive in Phase 2+ inside `packages/metadata` + adapters in `packages/api`
- Domain isolation preserved — metadata never imports from `creator/` or `listener/` features
