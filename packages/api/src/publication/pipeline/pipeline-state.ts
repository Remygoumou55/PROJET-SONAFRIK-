import type { MetadataRecordDto } from "../../metadata/application/dto";
import type { PreparePublicationRequestDto } from "../dto";
import type { PublicationPipelineConfig } from "../integration/feature-flags";
import type { PublicationContext } from "../ports";

export interface PublicationPackageState {
  readonly trackId: string;
  readonly metadataId: string;
  readonly creatorId: string;
  readonly simulatedIsrc: string | null;
  readonly reservedIsrc: string | null;
  readonly dryRun: boolean;
  readonly preparedAt: string;
  readonly futureHooks: readonly string[];
}

/** Mutable state carried through pipeline steps */
export interface PublicationPipelineState {
  ctx: PublicationContext;
  request: PreparePublicationRequestDto;
  config: PublicationPipelineConfig;
  metadata: MetadataRecordDto | null;
  simulatedIsrc: string | null;
  reservedIsrc: string | null;
  isrcSimulated: boolean;
  package: PublicationPackageState | null;
  persistencePlan: Readonly<Record<string, unknown>> | null;
  cancelled: boolean;
  cancelReason: string | null;
  legacySubmit?: () => Promise<void>;
}

export function createInitialPipelineState(
  ctx: PublicationContext,
  request: PreparePublicationRequestDto,
  config: PublicationPipelineConfig,
  legacySubmit?: () => Promise<void>,
): PublicationPipelineState {
  return {
    ctx,
    request,
    config,
    metadata: null,
    simulatedIsrc: null,
    reservedIsrc: null,
    isrcSimulated: false,
    package: null,
    persistencePlan: null,
    cancelled: false,
    cancelReason: null,
    legacySubmit,
  };
}

export interface PublicationPipelineStepHandler {
  readonly stepId: string;
  readonly order: number;
  execute(state: PublicationPipelineState): Promise<PublicationPipelineState>;
  rollback(state: PublicationPipelineState): Promise<void>;
}
