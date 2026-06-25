import type { ISRCValidationCode } from "./enums";

export interface ISRCValidationIssue {
  readonly code: ISRCValidationCode;
  readonly field: string;
  readonly message: string;
}

export interface ISRCValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ISRCValidationIssue[];
}
