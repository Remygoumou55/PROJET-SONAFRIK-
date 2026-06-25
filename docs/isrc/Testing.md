# ISRC Engine — Testing (Phase 2.5)

## Run tests

```powershell
cd "e:\PROJET SONAFRIK\packages\metadata"
pnpm test
pnpm exec vitest run --coverage
```

## Coverage targets (enforced)

| Metric | Threshold |
|---|---|
| Statements | ≥ 95% |
| Lines | ≥ 95% |
| Functions | ≥ 95% |
| Branches | ≥ 90% |

**Current:** 96.58% statements, 91.92% branches, 97.36% functions.

## Test suites (85 tests)

| File | Focus |
|---|---|
| `providers/providers.test.ts` | All 6 providers + factory |
| `ISRCParser.test.ts` | Parse + normalize + generate |
| `ISRCValidator.test.ts` | Validation codes + registry states |
| `ISRCEngine.test.ts` | Integration + multi-profile |
| `ISRCStress.test.ts` | 1000 generations, 5000 validations |
| `ISRCCoverage.test.ts` | Edge cases + error paths |
| `ISRCReservationService.test.ts` | Reserve lifecycle |
| `ISRCRegistry.test.ts` | Uniqueness + status |
| `ISRCSequenceService.test.ts` | Sequence + exhaustion |
| `ISRCPool.test.ts` | Pool operations |
| `ISRCAuditService.test.ts` | Audit trail |
| `repositories/InMemoryISRCRepository.test.ts` | Repository |
| `utils/utils.test.ts` | Utils + performance metrics |

## Concurrency tests

- 50 parallel `generate()` — zero collisions
- Mutex timeout verification
- Reservation conflict detection

## Stress tests

- 1000 sequential unique ISRCs
- 5000 validations under 2 seconds
