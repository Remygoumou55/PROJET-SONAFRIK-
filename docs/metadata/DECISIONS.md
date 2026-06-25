# Metadata Engine — Architecture Decisions (Phase 1.5)

> Decisions locked during stabilization. Phase 2 must not contradict these without an ADR update.

## ADR-001 — Single source of truth for types

**Decision:** All metadata types, enums, error codes, validation shapes, and context contracts live in `@sonafrik/types/metadata`.

**Rationale:** SONAFRIK monorepo rule — `packages/types` is the only type source. `@sonafrik/metadata` holds interfaces and error classes only.

**Phase 1.5 change:** Moved `MetadataContext`, `MetadataValidationIssue`, `MetadataValidationResult`, `METADATA_ERROR_CODES`, and `MetadataDomainRecord` from `@sonafrik/metadata` into `@sonafrik/types`.

---

## ADR-002 — Lifecycle status vs domain-specific status

**Decision:** Every domain record extends `MetadataRecordBase` with `status: MetadataStatus` (draft → published lifecycle). Domain-specific workflow states use distinct property names:

| Domain | Property | Enum |
|---|---|---|
| Distribution | `distributionStatus` | `DistributionStatus` |
| Fingerprint | `fingerprintStatus` | `FingerprintStatus` |
| Royalty | `bindingStatus` | `RoyaltyBindingStatus` |

**Rationale:** Reusing `status` for both lifecycle and domain workflow caused a TypeScript conflict on `DistributionMetadata` in Phase 1. Separate names preserve single responsibility per field.

---

## ADR-003 — MetadataRegistry vs RegistryService

**Decision:** Two contracts, two responsibilities:

| Contract | Layer | Mutability | Purpose |
|---|---|---|---|
| `MetadataRegistry` | `core/` | Read-only | Resolve metadata by entity ID |
| `RegistryService` | `services/` | Read/write | Register records, lookup by ISRC/UPC |

**Rationale:** Read resolution (engine orchestration) is separated from mutable registration (Phase 2 ISRC/UPC indexing). Not a duplication — different dependency directions.

---

## ADR-004 — Pipeline context inheritance

**Decision:** `MetadataPipelineContext extends MetadataContext` and adds `metadataId: MetadataID`.

**Rationale:** Pipeline execution always runs in an actor/correlation/locale context. Extending avoids field drift between `MetadataContext` and pipeline-specific context.

---

## ADR-005 — Pipeline steps vs pipeline actions

**Decision:** Two constant sets, intentionally different:

| Constant | Location | Granularity | Example |
|---|---|---|---|
| `METADATA_PIPELINE_STEPS` | `@sonafrik/metadata/constants` | Orchestration slot names | `generate_identifiers`, `prepare_distribution` |
| `METADATA_PIPELINE_ACTION` | `@sonafrik/types/metadata` | Handler action classification | `generate`, `distribute` |

**Rationale:** A single pipeline step may invoke one or more actions. Merging them would blur orchestration from handler taxonomy.

---

## ADR-006 — MetadataDomainRecord union

**Decision:** `MetadataDomainRecord` is defined once in `@sonafrik/types/metadata/domains.ts` and used by `MetadataRegistry.resolveByMetadataId` and `MetadataRepository.findById`.

**Rationale:** Eliminates duplicated 10-type unions across contracts; single maintenance point.

---

## ADR-007 — Subpath exports for tree-shaking

**Decision:** `@sonafrik/types` exposes `./metadata` subpath (alongside `./catalog`).

**Rationale:** Future consumers can import metadata types without pulling the full types barrel. `@sonafrik/metadata` keeps minimal subpaths (`./core`, `./errors`).

---

## ADR-008 — Package independence

**Decision:** `@sonafrik/metadata` depends only on `@sonafrik/types`. No React, Supabase, UI, or `packages/api` imports.

**Verified:** Zero consumers outside docs in Phase 1.5. No circular dependencies detected.
