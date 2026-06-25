# ISRC Engine — Validation

## Validation layers

### 1. Format validation (synchronous)

`engine.validateFormat(raw)` checks:

| Rule | Code |
|---|---|
| Empty / malformed input | `invalid_format` |
| Length ≠ 12 compact chars | `invalid_length` |
| Country not in whitelist | `invalid_country_code` |
| Registrant not in whitelist | `invalid_registrant` |
| Year outside min/max | `invalid_year` |
| Designation not 5 digits | `invalid_designation` |
| Designation < 00001 | `invalid_designation` |
| Normalization round-trip failure | `invalid_format` |

### 2. Registry validation (async)

`engine.validate(raw)` adds registry checks:

| Status | Code |
|---|---|
| `active` | `duplicate` |
| `reserved` | `reserved` |
| `archived` | `archived` |
| `deleted` | `deleted` |
| `available` | ✅ valid |

## Configurable rules

Validation reads from `ISRCFormatConfig`:

```typescript
{
  totalLength: 12,
  segments: [
    { name: "country", length: 2, pattern: "^[A-Z]{2}$" },
    { name: "registrant", length: 3, pattern: "^[A-Z0-9]{3}$" },
    { name: "year", length: 2, pattern: "^[0-9]{2}$" },
    { name: "designation", length: 5, pattern: "^[0-9]{5}$" },
  ],
  allowedCountryCodes: ["GN"],
  allowedRegistrantCodes: ["SFK"],
  minYear: 0,
  maxYear: 99,
}
```

## Security

- Rejects non-alphanumeric characters (except `-` and spaces during normalization)
- No SQL/command injection vectors — pure string processing
- Registry mutex prevents concurrent reservation collisions
