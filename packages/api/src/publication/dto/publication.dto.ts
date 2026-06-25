/** Publication DTOs — orchestrator output only, no domain entities */

export interface PreparePublicationRequestDto {
  readonly trackId: string;
  readonly metadataId: string;
  readonly creatorId: string;
  readonly proposedIsrc?: string;
}

export interface PublicationStepResultDto {
  readonly stepId: string;
  readonly success: boolean;
  readonly message: string | null;
  readonly completedAt: string;
}

export interface PublicationPackageDto {
  readonly trackId: string;
  readonly metadataId: string;
  readonly creatorId: string;
  readonly simulatedIsrc: string | null;
  readonly reservedIsrc?: string | null;
  readonly dryRun: boolean;
  readonly preparedAt: string;
  readonly futureHooks: readonly string[];
}

export interface PublicationPreparedResultDto {
  readonly status: "ready" | "cancelled";
  readonly package: PublicationPackageDto | null;
  readonly steps: readonly PublicationStepResultDto[];
  readonly correlationId: string;
  readonly dryRun: boolean;
}
