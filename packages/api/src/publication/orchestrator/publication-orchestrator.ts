import type { PreparePublicationRequestDto, PublicationPreparedResultDto, PublicationStepResultDto } from "../dto";
import type { PublicationPipelineConfig } from "../integration/feature-flags";
import { mapToPublicationError } from "../errors";
import {
  publicationCancelledEvent,
  publicationPreparedEvent,
  publicationReadyEvent,
  publicationRequestedEvent,
  publicationValidatedEvent,
} from "../events";
import {
  createInitialPipelineState,
  createDefaultPublicationPipeline,
  type PublicationPipelineStepHandler,
} from "../pipeline";
import type {
  IdempotencyStore,
  PublicationContext,
  PublicationEventPublisher,
  PublicationOrchestratorPorts,
} from "../ports";
import { InMemoryIdempotencyStore, InMemoryPublicationEventPublisher } from "../ports";
import { PublicationTransaction } from "../transactions";
import { validatePreparePublicationRequest } from "../validators";
import { WorkflowConflictError } from "../errors";
import type { MetadataApplicationPorts } from "../../metadata/application/ports";

/**
 * Unique publication workflow coordinator.
 * Phase 5: flag-driven dry-run → persistence → validation → ISRC → real publish.
 */
export class PublicationOrchestrator {
  private readonly pipeline: readonly PublicationPipelineStepHandler[];
  private readonly metadataPorts: MetadataApplicationPorts;

  constructor(
    private readonly ports: PublicationOrchestratorPorts,
    metadataPorts: MetadataApplicationPorts,
    private readonly events: PublicationEventPublisher = new InMemoryPublicationEventPublisher(),
    private readonly idempotency: IdempotencyStore = new InMemoryIdempotencyStore(),
    extraSteps: readonly PublicationPipelineStepHandler[] = [],
  ) {
    this.metadataPorts = metadataPorts;
    this.pipeline = createDefaultPublicationPipeline(
      ports.metadataService,
      metadataPorts,
      extraSteps,
    );
  }

  async preparePublication(
    ctx: PublicationContext,
    rawRequest: unknown,
    config: PublicationPipelineConfig,
    legacySubmit?: () => Promise<void>,
  ): Promise<PublicationPreparedResultDto> {
    const request = validatePreparePublicationRequest(rawRequest) as PreparePublicationRequestDto;

    if (ctx.idempotencyKey) {
      if (this.idempotency.has(ctx.idempotencyKey)) {
        const existing = this.idempotency.get(ctx.idempotencyKey);
        if (
          existing &&
          (existing.trackId !== request.trackId || existing.metadataId !== request.metadataId)
        ) {
          throw new WorkflowConflictError("Clé idempotence déjà utilisée avec une autre requête");
        }
      } else {
        this.idempotency.set(ctx.idempotencyKey, request);
      }
    }

    const transaction = new PublicationTransaction();
    let state = createInitialPipelineState(ctx, request, config, legacySubmit);
    const stepResults: PublicationStepResultDto[] = [];

    try {
      await this.events.publish(
        publicationRequestedEvent(ctx.actorId, ctx.correlationId, request.trackId, request.metadataId),
      );

      for (const step of this.pipeline) {
        const completedAt = new Date().toISOString();
        state = await transaction.runStep(
          step,
          async () => step.execute(state),
          async () => step.rollback(state),
        );
        stepResults.push({
          stepId: step.stepId,
          success: true,
          message: null,
          completedAt,
        });

        if (step.stepId === "validate-metadata" && state.config.metadataValidation) {
          await this.events.publish(
            publicationValidatedEvent(ctx.actorId, ctx.correlationId, request.metadataId),
          );
        }
      }

      if (!state.package) {
        throw mapToPublicationError(new Error("Package non produit"));
      }

      await this.events.publish(
        publicationPreparedEvent(ctx.actorId, ctx.correlationId, state.request.metadataId),
      );
      await this.events.publish(
        publicationReadyEvent(ctx.actorId, ctx.correlationId, state.request.metadataId),
      );

      return {
        status: "ready",
        package: {
          ...state.package,
          metadataId: state.request.metadataId,
        },
        steps: stepResults,
        correlationId: ctx.correlationId,
        dryRun: config.dryRun,
      };
    } catch (error) {
      await this.events.publish(
        publicationCancelledEvent(
          ctx.actorId,
          ctx.correlationId,
          request.metadataId,
          error instanceof Error ? error.message : "unknown",
        ),
      );
      throw mapToPublicationError(error);
    }
  }

  getPipelineSteps(): readonly string[] {
    return this.pipeline.map((s) => s.stepId);
  }
}

export function createPublicationOrchestrator(
  ports: PublicationOrchestratorPorts,
  metadataPorts: MetadataApplicationPorts,
  events?: PublicationEventPublisher,
  idempotency?: IdempotencyStore,
  extraSteps?: readonly PublicationPipelineStepHandler[],
): PublicationOrchestrator {
  return new PublicationOrchestrator(ports, metadataPorts, events, idempotency, extraSteps);
}
