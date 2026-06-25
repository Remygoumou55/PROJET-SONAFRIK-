# ISRC Engine — Sequence Management

## Sequence key

Each sequence is scoped by:

```typescript
interface ISRCSequenceKey {
  countryCode: string;      // e.g. "GN"
  registrantCode: string;   // e.g. "SFK"
  yearOfReference: string;  // e.g. "24"
}
```

Internal map key: `GN:SFK:24`

## Flow

1. `ISRCSequenceService.getNextDesignation(key)` — mutex-protected increment
2. `ISRCGenerator.generate(key, designation)` — builds canonical ISRC
3. `ISRCAuditService` records `isrc.generated` + `isrc.sequence_advanced`

## Designation range

- Minimum: `00001`
- Maximum: `99999`
- Exhaustion throws `isrc_sequence_exhausted`

## MVP policy

The sequence service is **functional for testing** but:

- Not connected to track creation
- Not persisted to Supabase (in-memory only)
- Phase 3 will implement `ISRCRepository.saveSequence()`

## Example

```typescript
const key = { countryCode: "GN", registrantCode: "SFK", yearOfReference: "24" };

await engine.generate(key); // GNSFK2400001
await engine.generate(key); // GNSFK2400002
await engine.generate(key); // GNSFK2400003
```

## Concurrency

20 parallel `generate()` calls produce 20 unique ISRCs — verified in `ISRCEngine.test.ts`.
