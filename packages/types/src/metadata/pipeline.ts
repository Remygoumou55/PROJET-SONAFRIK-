import type { MetadataContext } from "./context";
import type { MetadataID } from "./ids";
import type { MetadataValidationState } from "./enums";

export const METADATA_PIPELINE_ACTION = {
  VALIDATE: "validate",
  GENERATE: "generate",
  NORMALIZE: "normalize",
  PUBLISH: "publish",
  ARCHIVE: "archive",
  FINGERPRINT: "fingerprint",
  DISTRIBUTE: "distribute",
  LINK_ROYALTY: "link_royalty",
} as const;

export type MetadataPipelineAction =
  (typeof METADATA_PIPELINE_ACTION)[keyof typeof METADATA_PIPELINE_ACTION];

/** Pipeline execution context — extends base context with target metadata ID */
export interface MetadataPipelineContext extends MetadataContext {
  readonly metadataId: MetadataID;
}

export interface MetadataPipelineStep {
  readonly name: string;
  readonly action: MetadataPipelineAction;
  readonly order: number;
}

export interface MetadataPipelineStepResult {
  step: MetadataPipelineStep;
  validationState: MetadataValidationState;
  success: boolean;
  message: string | null;
  completedAt: string;
}

export interface MetadataPipelineResult {
  context: MetadataPipelineContext;
  steps: readonly MetadataPipelineStepResult[];
  success: boolean;
  completedAt: string;
}
