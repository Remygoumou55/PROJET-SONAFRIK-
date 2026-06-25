import type { ISRCFormatConfig, ISRCProviderBundle } from "@sonafrik/types";
import { ConfigCountryProvider } from "./ConfigCountryProvider";
import { ConfigFormattingProvider } from "./ConfigFormattingProvider";
import { ConfigRegistrantProvider } from "./ConfigRegistrantProvider";
import { ConfigSequenceProvider } from "./ConfigSequenceProvider";
import { ConfigValidationProvider } from "./ConfigValidationProvider";
import { ConfigYearProvider } from "./ConfigYearProvider";
import { ISRCParserImpl } from "../ISRCParser";
import { ISRCNormalizerImpl } from "../ISRCNormalizer";

export function createProviderBundle(
  config: ISRCFormatConfig,
  overrides: Partial<ISRCProviderBundle> = {},
): ISRCProviderBundle {
  const formatting = overrides.formatting ?? new ConfigFormattingProvider(config);
  const country = overrides.country ?? new ConfigCountryProvider(formatting);
  const registrant = overrides.registrant ?? new ConfigRegistrantProvider(formatting);
  const year = overrides.year ?? new ConfigYearProvider(formatting);
  const sequence = overrides.sequence ?? new ConfigSequenceProvider(formatting);

  if (overrides.validation) {
    return Object.freeze({
      formatting,
      country,
      registrant,
      year,
      sequence,
      validation: overrides.validation,
    });
  }

  const parser = new ISRCParserImpl(formatting);
  const normalizer = new ISRCNormalizerImpl(formatting, parser);
  const validation = new ConfigValidationProvider(
    formatting,
    country,
    registrant,
    year,
    (raw) => parser.parse(raw),
    (raw) => normalizer.normalize(raw),
  );

  return Object.freeze({
    formatting,
    country,
    registrant,
    year,
    sequence,
    validation,
  });
}
