# ISRC Engine — ISO 3901 Compliance

## Standard alignment

The engine implements ISO 3901 structure:

| Segment | Length | Pattern | Example |
|---|---|---|---|
| Country | 2 | `[A-Z]{2}` | GN |
| Registrant | 3 | `[A-Z0-9]{3}` | SFK |
| Year | 2 | `[0-9]{2}` | 24 |
| Designation | 5 | `[0-9]{5}` | 00001 |

**Canonical form:** 12 uppercase alphanumeric characters (no separator).

**Display form:** `{country}-{registrant}-{year}-{designation}` (configurable via `displayPattern`).

## Configurable, never hardcoded

All format rules live in `ISRCFormatConfig`. Business logic reads from providers — never embeds country codes or registrant prefixes.

## Territory profiles

Profiles are configuration presets, not code branches:

| Profile | Country | Registrant whitelist |
|---|---|---|
| `ISRC_PROFILE_GN` | GN | SFK |
| `ISRC_PROFILE_CI` | CI | SFK |
| `ISRC_PROFILE_SN` | SN | SFK |
| `ISRC_PROFILE_GH` | GH | SFK |
| `ISRC_PROFILE_FR` | FR | (any valid) |
| `ISRC_PROFILE_US` | US | (any valid) |
| `ISO3901_FORMAT_CONFIG` | (any valid) | (any valid) |

## Future official prefix

When SONAFRIK receives an official ISRC registrant code from IFPI/national agency:

1. Add profile via `createISRCProfileConfig("GN", { allowedRegistrantCodes: ["XXX"] })`
2. No engine code modification required
3. Legal review documented before production allocation

## Validation codes

Full list in `@sonafrik/types/metadata/isrc/enums` — `ISRC_VALIDATION_CODE`.
