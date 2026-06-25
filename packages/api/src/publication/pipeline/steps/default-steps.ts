import type { MetadataRecordDto } from "../../../metadata/application/dto";
import type { MetadataApplicationService } from "../../../metadata/application/services";
import {
  MetadataIncompleteError,
  PublicationValidationFailedError,
} from "../../errors";
import {
  assertPublicationActor,
  assertPublicationOwnership,
  toApplicationContext,
} from "../../ports";
import type { PublicationPipelineStepHandler } from "../pipeline-state";

export function createVerifyContextStep(): PublicationPipelineStepHandler {
  return {
    stepId: "verify-context",
    order: 1,
    async execute(state) {
      assertPublicationActor(state.ctx);
      assertPublicationOwnership(state.ctx, state.request.creatorId);
      if (!state.request.trackId) {
        throw new PublicationValidationFailedError("trackId requis");
      }
      return state;
    },
    async rollback() {
      /* no side effects */
    },
  };
}

export function createValidateMetadataStep(
  metadataService: MetadataApplicationService,
): PublicationPipelineStepHandler {
  return {
    stepId: "validate-metadata",
    order: 3,
    async execute(state) {
      if (!state.config.metadataValidation) {
        return state;
      }
      const appCtx = toApplicationContext(state.ctx);
      const metadata = (await metadataService.executeQuery(appCtx, {
        type: "GetMetadataById",
        metadataId: state.request.metadataId,
      })) as MetadataRecordDto | null;
      if (!metadata) {
        throw new MetadataIncompleteError("Métadonnées introuvables");
      }
      if (metadata.status === "archived" || metadata.status === "deleted") {
        throw new PublicationValidationFailedError("Métadonnées non publiables");
      }
      if (metadata.entityType !== "track") {
        throw new PublicationValidationFailedError("Seules les métadonnées track sont supportées");
      }
      return { ...state, metadata };
    },
    async rollback() {
      /* read-only */
    },
  };
}

export function createBuildPackageStep(): PublicationPipelineStepHandler {
  return {
    stepId: "build-publication-package",
    order: 5,
    async execute(state) {
      const pkg = {
        trackId: state.request.trackId,
        metadataId: state.request.metadataId,
        creatorId: state.request.creatorId,
        simulatedIsrc: state.simulatedIsrc,
        reservedIsrc: state.reservedIsrc,
        dryRun: state.config.dryRun,
        preparedAt: new Date().toISOString(),
        futureHooks: ["upc", "fingerprint", "distribution", "royalties", "audit"],
      };
      return { ...state, package: pkg };
    },
    async rollback(state) {
      state.package = null;
    },
  };
}

export function createValidateDependenciesStep(): PublicationPipelineStepHandler {
  return {
    stepId: "validate-dependencies",
    order: 6,
    async execute(state) {
      if (!state.config.metadataValidation) {
        return state;
      }
      if (!state.package) {
        throw new MetadataIncompleteError("Package de publication manquant");
      }
      if (state.metadata?.entityId !== state.request.trackId) {
        throw new PublicationValidationFailedError("Incohérence trackId / métadonnées");
      }
      return state;
    },
    async rollback() {
      /* no side effects */
    },
  };
}

export function createPreparePersistenceStep(): PublicationPipelineStepHandler {
  return {
    stepId: "prepare-persistence",
    order: 7,
    async execute(state) {
      if (!state.package) {
        throw new MetadataIncompleteError("Package requis");
      }
      const writes: string[] = [];
      if (state.config.persistence && state.metadata) {
        writes.push("metadata.upsert");
      }
      if (state.config.isrcReservation && state.reservedIsrc) {
        writes.push("isrc.reserve");
      }
      const plan = {
        mode: state.config.dryRun ? "dry-run" : "write",
        metadataId: state.package.metadataId,
        trackId: state.package.trackId,
        simulatedIsrc: state.package.simulatedIsrc,
        reservedIsrc: state.package.reservedIsrc,
        writes,
      };
      return { ...state, persistencePlan: plan };
    },
    async rollback(state) {
      state.persistencePlan = null;
    },
  };
}
