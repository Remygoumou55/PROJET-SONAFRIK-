import type { MetadataApplicationService } from "../../metadata/application/services";
import type { MetadataApplicationPorts } from "../../metadata/application/ports";
import {
  createBuildPackageStep,
  createPreparePersistenceStep,
  createValidateDependenciesStep,
  createValidateMetadataStep,
  createVerifyContextStep,
} from "./steps/default-steps";
import { createResolveMetadataStep } from "../integration/metadata-resolver";
import {
  createCatalogSubmitStep,
  createIsrcReservationStep,
} from "../integration/integration-steps";
import type { PublicationPipelineStepHandler } from "./pipeline-state";

/** Publication pipeline — extensible, flag-driven (Phase 5) */
export function createDefaultPublicationPipeline(
  metadataService: MetadataApplicationService,
  ports: MetadataApplicationPorts,
  extraSteps: readonly PublicationPipelineStepHandler[] = [],
): readonly PublicationPipelineStepHandler[] {
  const core: PublicationPipelineStepHandler[] = [
    createVerifyContextStep(),
    createResolveMetadataStep(metadataService),
    createValidateMetadataStep(metadataService),
    createIsrcReservationStep(ports),
    createBuildPackageStep(),
    createValidateDependenciesStep(),
    createPreparePersistenceStep(),
    createCatalogSubmitStep(),
  ];
  return [...core, ...extraSteps].sort((a, b) => a.order - b.order);
}

export function createPublicationPipelineRegistry(
  steps: readonly PublicationPipelineStepHandler[],
): Map<string, PublicationPipelineStepHandler> {
  return new Map(steps.map((s) => [s.stepId, s]));
}
