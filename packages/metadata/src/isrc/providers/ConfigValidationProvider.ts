import type {
  ISRCComponents,
  ISRCCountryProvider,
  ISRCFormattingProvider,
  ISRCRegistrantProvider,
  ISRCRegistryEntry,
  ISRCValidationCode,
  ISRCValidationIssue,
  ISRCValidationProvider,
  ISRCValidationResult,
  ISRCValue,
  ISRCYearProvider,
} from "@sonafrik/types";
import { ISRC_REGISTRY_STATUS, ISRC_VALIDATION_CODE } from "@sonafrik/types";

function issue(
  code: ISRCValidationCode,
  field: string,
  message: string,
): ISRCValidationIssue {
  return { code, field, message };
}

export class ConfigValidationProvider implements ISRCValidationProvider {
  constructor(
    private readonly formatting: ISRCFormattingProvider,
    private readonly country: ISRCCountryProvider,
    private readonly registrant: ISRCRegistrantProvider,
    private readonly year: ISRCYearProvider,
    private readonly parseFn: (raw: string) => ISRCComponents,
    private readonly normalizeFn: (raw: string) => ISRCValue,
  ) {}

  validateInput(raw: string): ISRCValidationResult {
    const issues: ISRCValidationIssue[] = [];

    if (!raw || typeof raw !== "string" || raw.trim().length === 0) {
      return {
        valid: false,
        issues: [issue(ISRC_VALIDATION_CODE.INVALID_FORMAT, "isrc", "ISRC vide")],
      };
    }

    if (!this.formatting.getAllowedInputPattern().test(raw.trim())) {
      issues.push(
        issue(ISRC_VALIDATION_CODE.INVALID_FORMAT, "isrc", "Caractères non autorisés"),
      );
    }

    const compact = this.formatting.stripInput(raw);
    if (compact.length !== this.formatting.config.totalLength) {
      issues.push(
        issue(
          ISRC_VALIDATION_CODE.INVALID_LENGTH,
          "isrc",
          `Longueur attendue ${this.formatting.config.totalLength}, reçue ${compact.length}`,
        ),
      );
    }

    if (!/^[A-Z0-9]+$/.test(compact)) {
      issues.push(
        issue(ISRC_VALIDATION_CODE.INVALID_FORMAT, "isrc", "Caractères non alphanumériques"),
      );
    }

    let components: ISRCComponents;
    try {
      components = this.parseFn(raw);
    } catch {
      if (issues.length === 0) {
        issues.push(
          issue(ISRC_VALIDATION_CODE.INVALID_FORMAT, "isrc", "Format ISRC non reconnu"),
        );
      }
      return { valid: false, issues };
    }

    const componentResult = this.validateComponents(components);
    issues.push(...componentResult.issues);

    try {
      this.normalizeFn(raw);
    } catch {
      issues.push(
        issue(ISRC_VALIDATION_CODE.INVALID_FORMAT, "isrc", "Normalisation impossible"),
      );
    }

    return { valid: issues.length === 0, issues };
  }

  validateComponents(components: ISRCComponents): ISRCValidationResult {
    const issues: ISRCValidationIssue[] = [];

    const countryCheck = this.country.validate(components.countryCode as string);
    if (!countryCheck.valid) {
      issues.push(
        issue(
          ISRC_VALIDATION_CODE.INVALID_COUNTRY_CODE,
          "country",
          countryCheck.message ?? "Code pays invalide",
        ),
      );
    }

    const registrantCheck = this.registrant.validate(
      components.registrantCode,
      components.countryCode as string,
    );
    if (!registrantCheck.valid) {
      issues.push(
        issue(
          ISRC_VALIDATION_CODE.INVALID_REGISTRANT,
          "registrant",
          registrantCheck.message ?? "Code registrant invalide",
        ),
      );
    }

    const yearCheck = this.year.validate(components.yearOfReference);
    if (!yearCheck.valid) {
      issues.push(
        issue(
          ISRC_VALIDATION_CODE.INVALID_YEAR,
          "year",
          yearCheck.message ?? "Année invalide",
        ),
      );
    }

    if (!this.formatting.validateSegment("designation", components.designationCode)) {
      issues.push(
        issue(
          ISRC_VALIDATION_CODE.INVALID_DESIGNATION,
          "designation",
          "Code de désignation invalide",
        ),
      );
    } else {
      const designationNum = parseInt(components.designationCode, 10);
      if (designationNum < this.formatting.getMinDesignation()) {
        issues.push(
          issue(
            ISRC_VALIDATION_CODE.INVALID_DESIGNATION,
            "designation",
            `Le numéro de séquence doit être >= ${String(this.formatting.getMinDesignation()).padStart(5, "0")}`,
          ),
        );
      }
    }

    return { valid: issues.length === 0, issues };
  }

  validateRegistryState(isrc: ISRCValue, entry: ISRCRegistryEntry | null): ISRCValidationResult {
    if (!entry) {
      return { valid: true, issues: [] };
    }

    if (entry.isrc !== isrc) {
      return {
        valid: false,
        issues: [issue(ISRC_VALIDATION_CODE.INVALID_FORMAT, "isrc", "Entrée registre incohérente")],
      };
    }

    const statusIssue = this.statusToIssue(entry.status);
    if (statusIssue) {
      return { valid: false, issues: [statusIssue] };
    }

    return { valid: true, issues: [] };
  }

  private statusToIssue(status: ISRCRegistryEntry["status"]): ISRCValidationIssue | null {
    switch (status) {
      case ISRC_REGISTRY_STATUS.RESERVED:
        return issue(ISRC_VALIDATION_CODE.RESERVED, "status", "ISRC réservé");
      case ISRC_REGISTRY_STATUS.ARCHIVED:
        return issue(ISRC_VALIDATION_CODE.ARCHIVED, "status", "ISRC archivé");
      case ISRC_REGISTRY_STATUS.DELETED:
        return issue(ISRC_VALIDATION_CODE.DELETED, "status", "ISRC supprimé");
      case ISRC_REGISTRY_STATUS.ACTIVE:
        return issue(ISRC_VALIDATION_CODE.DUPLICATE, "status", "ISRC déjà actif");
      default:
        return null;
    }
  }
}
