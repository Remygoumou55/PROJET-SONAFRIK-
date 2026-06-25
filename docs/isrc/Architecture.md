# ISRC Engine — Architecture (Phase 2.5)

## Provider-based design

```
ISRCEngine
├── ISRCFormattingProvider   ← format rules (ISO 3901 config)
├── ISRCCountryProvider      ← country validation + whitelist
├── ISRCRegistrantProvider   ← registrant validation + whitelist
├── ISRCYearProvider         ← year range validation
├── ISRCSequenceProvider     ← thread-safe designation counters
├── ISRCValidationProvider   ← composite validation
├── ISRCRegistry             ← in-memory uniqueness
├── ISRCReservationService   ← reserve / release / commit
└── ISRCAuditService         ← audit trail
```

## Dependency injection

```typescript
import { createISRCEngine, createProviderBundle, ISRC_PROFILE_GN } from "@sonafrik/metadata/isrc";

// Option A — profile config (builds all providers)
const engine = createISRCEngine({ config: ISRC_PROFILE_GN });

// Option B — explicit provider bundle
const providers = createProviderBundle(ISRC_PROFILE_FR);
const engine = createISRCEngine({ providers });
```

## SOLID compliance

| Principle | Implementation |
|---|---|
| Single Responsibility | Each provider owns one concern |
| Open/Closed | New territories = new config profile, zero code change |
| Liskov Substitution | All providers implement interfaces from `@sonafrik/types` |
| Interface Segregation | 6 provider interfaces + repository |
| Dependency Inversion | Engine depends on interfaces, not implementations |

## Layer isolation

```
@sonafrik/metadata/isrc  →  @sonafrik/types  ONLY
```

No React. No Supabase. No apps/web. No packages/api.

## Types location

- Interfaces: `@sonafrik/types/metadata/isrc/providers`
- Config: `@sonafrik/types/metadata/isrc/config`
- Implementation: `@sonafrik/metadata/isrc/providers/`
