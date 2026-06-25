import type {
  MetadataPipelineContext,
  MetadataPipelineResult,
  MetadataPipelineStep,
} from "@sonafrik/types";

/** Pipeline orchestration contract — steps executed sequentially in Phase 2+ */
export interface MetadataPipeline {
  readonly steps: readonly MetadataPipelineStep[];
  execute(context: MetadataPipelineContext): Promise<MetadataPipelineResult>;
}

export interface MetadataPipelineStepHandler {
  readonly step: MetadataPipelineStep;
  handle(context: MetadataPipelineContext): Promise<MetadataPipelineResult>;
}
