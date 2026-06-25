# ISRC Engine — Providers

## Provider interfaces

Defined in `@sonafrik/types/metadata/isrc/providers.ts`.

| Provider | Responsibility | Default implementation |
|---|---|---|
| `ISRCFormattingProvider` | Strip, build, display, segment validation | `ConfigFormattingProvider` |
| `ISRCCountryProvider` | Country code validation + whitelist | `ConfigCountryProvider` |
| `ISRCRegistrantProvider` | Registrant validation + whitelist | `ConfigRegistrantProvider` |
| `ISRCYearProvider` | Year range validation | `ConfigYearProvider` |
| `ISRCSequenceProvider` | Designation counter (mutex-protected) | `ConfigSequenceProvider` |
| `ISRCValidationProvider` | Composite input/component/registry validation | `ConfigValidationProvider` |

## Factory

```typescript
import { createProviderBundle, ISO3901_FORMAT_CONFIG } from "@sonafrik/metadata/isrc";

const providers = createProviderBundle(ISO3901_FORMAT_CONFIG);
```

Override any provider:

```typescript
const providers = createProviderBundle(ISO3901_FORMAT_CONFIG, {
  sequence: customSequenceProvider,
});
```

## Format Provider

`ConfigFormattingProvider` is the Format Provider — all segment patterns, lengths, separators, and display templates are injected via `ISRCFormatConfig`:

```typescript
{
  totalLength: 12,
  separator: "-",
  displayPattern: "{country}-{registrant}-{year}-{designation}",
  segments: [
    { name: "country", length: 2, pattern: "^[A-Z]{2}$" },
    // ...
  ],
  minDesignation: 1,
  maxDesignation: 99999,
  allowedInputPattern: "^[A-Za-z0-9\\s-]+$",
}
```

## Swapping providers

Phase 3 will add:
- `SupabaseSequenceProvider` implements `ISRCSequenceProvider`
- `SupabaseISRCRepository` implements `ISRCRepository`

Zero change to `ISRCEngine` orchestration.
