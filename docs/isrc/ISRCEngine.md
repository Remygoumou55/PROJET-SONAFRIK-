# ISRC Engine — Overview

> Phase 2 — Headless ISRC Engine Core  
> Status: **Functional, not wired to MVP**

## Mission

The ISRC Engine generates, validates, parses, normalizes, reserves, and tracks International Standard Recording Codes (ISO 3901) entirely in the background. No user-facing surface exists.

## Entry point

```typescript
import { createISRCEngine, SONAFRIK_GN_FORMAT_CONFIG } from "@sonafrik/metadata/isrc";

const engine = createISRCEngine({ config: SONAFRIK_GN_FORMAT_CONFIG });

const isrc = await engine.generate({
  countryCode: "GN",
  registrantCode: "SFK",
  yearOfReference: "24",
});

await engine.register(isrc);
```

## Subsystems

| Component | Responsibility |
|---|---|
| `ISRCEngine` | Orchestrator facade |
| `ISRCParser` | Decompose raw input into typed segments |
| `ISRCNormalizer` | Canonical compact form + display formatting |
| `ISRCValidator` | Format + registry state validation |
| `ISRCGenerator` | Build ISRC from sequence key + designation |
| `ISRCSequenceService` | Thread-safe sequential counters |
| `ISRCRegistry` | In-memory uniqueness and lookup |
| `ISRCPool` | Pre-allocated available codes |
| `ISRCReservationService` | Reserve / release / commit lifecycle |
| `ISRCAuditService` | In-memory audit trail |
| `ISRCRepository` | Persistence interface (Phase 3+) |

## Format configuration

Format rules live in `ISRCFormatConfig` (`@sonafrik/types/metadata/isrc`). Never hardcoded in logic.

- Default: `ISO3901_FORMAT_CONFIG` — CC-XXX-YY-NNNNN
- SONAFRIK Guinea: `SONAFRIK_GN_FORMAT_CONFIG` — country GN, registrant SFK

## Integration rule

```
Phase 3 ONLY:
  packages/api  →  @sonafrik/metadata/isrc  →  Supabase adapter

FORBIDDEN in Phase 2:
  apps/web, workflows, track creation, publication
```

## Package location

- Types: `@sonafrik/types/metadata/isrc`
- Implementation: `@sonafrik/metadata/isrc`
- Tests: `packages/metadata/src/isrc/*.test.ts`
