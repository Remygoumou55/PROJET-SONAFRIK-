import { newRandomId } from "../utils/random-id";
import type { MetadataApplicationService } from "../../metadata/application/services";
import type { MetadataRecordDto } from "../../metadata/application/dto";
import { toApplicationContext } from "../ports";
import type { PublicationPipelineStepHandler } from "../pipeline/pipeline-state";

/** Find or create metadata record for a track when persistence is enabled */
export function createResolveMetadataStep(
  metadataService: MetadataApplicationService,
): PublicationPipelineStepHandler {
  return {
    stepId: "resolve-metadata",
    order: 2,
    async execute(state) {
      const appCtx = toApplicationContext(state.ctx);
      const found = (await metadataService.executeQuery(appCtx, {
        type: "FindMetadata",
        entityType: "track",
        entityId: state.request.trackId,
      })) as MetadataRecordDto | null;

      if (found) {
        return { ...state, request: { ...state.request, metadataId: found.id }, metadata: found };
      }

      if (!state.config.persistence) {
        return state;
      }

      const metadataId = newRandomId();
      const now = new Date().toISOString();
      const created = (await metadataService.executeCommand(appCtx, {
        type: "CreateMetadata",
        payload: {
          id: metadataId,
          entityType: "track",
          entityId: state.request.trackId,
          status: "draft",
          source: "manual",
          visibility: "private",
          validationState: "pending",
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
      })) as MetadataRecordDto;

      return {
        ...state,
        request: { ...state.request, metadataId: created.id },
        metadata: created,
      };
    },
    async rollback() {
      /* creation compensated by transaction rollback on later failure */
    },
  };
}
