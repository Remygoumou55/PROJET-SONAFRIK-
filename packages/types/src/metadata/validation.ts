import type { MetadataValidationState } from "./enums";

export interface MetadataValidationIssue {
  field: string;
  code: string;
  message: string;
}

export interface MetadataValidationResult {
  state: MetadataValidationState;
  issues: readonly MetadataValidationIssue[];
}
