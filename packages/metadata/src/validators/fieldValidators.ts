import type {
  CountryCode,
  ISRCValue,
  LanguageCode,
  MetadataContext,
  MetadataValidationResult,
  UPCValue,
} from "@sonafrik/types";

export interface CountryValidator {
  validate(code: CountryCode, context: MetadataContext): Promise<MetadataValidationResult>;
}

export interface LanguageValidator {
  validate(code: LanguageCode, context: MetadataContext): Promise<MetadataValidationResult>;
}

export interface GenreValidator {
  validate(genreIds: readonly string[], context: MetadataContext): Promise<MetadataValidationResult>;
}

/** Phase 1 metadata field validator contract — distinct from ISRC Engine `ISRCValidator` */
export interface ISRCFieldValidator {
  validate(value: ISRCValue, context: MetadataContext): Promise<MetadataValidationResult>;
}

export interface UPCValidator {
  validate(value: UPCValue, context: MetadataContext): Promise<MetadataValidationResult>;
}

export interface FingerprintValidator {
  validate(hash: string, context: MetadataContext): Promise<MetadataValidationResult>;
}
