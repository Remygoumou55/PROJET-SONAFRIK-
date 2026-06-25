# ISRC Engine — Tests

## Run tests

```powershell
cd "e:\PROJET SONAFRIK\packages\metadata"
pnpm test
```

Or from monorepo root (after turbo task):

```powershell
pnpm exec turbo run test --filter=@sonafrik/metadata
```

## Test files

| File | Coverage |
|---|---|
| `ISRCParser.test.ts` | Parse hyphenated, compact, lowercase; reject invalid |
| `ISRCNormalizer.test.ts` | Canonical form, display, injection rejection |
| `ISRCValidator.test.ts` | All validation codes, registry states |
| `ISRCGenerator.test.ts` | Generation, range, whitelist |
| `ISRCSequenceService.test.ts` | Increment, reset, exhaustion |
| `ISRCRegistry.test.ts` | Register, duplicate, status |
| `ISRCReservationService.test.ts` | Reserve, release, commit |
| `ISRCPool.test.ts` | Pool add/take, registry sync |
| `ISRCEngine.test.ts` | Integration + concurrency |

## Edge cases covered

- Invalid length, format, country, registrant, year, designation
- Duplicate, reserved, archived, deleted registry states
- Sequence exhaustion at 99999
- Concurrent generation (20 parallel)
- Injection character rejection
- Reservation conflict (double reserve)

## Coverage target

Phase 2 requires high coverage on `src/isrc/` — all core services have dedicated test files.
