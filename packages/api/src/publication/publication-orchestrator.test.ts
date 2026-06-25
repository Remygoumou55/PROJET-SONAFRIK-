import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createInMemoryMetadataApplicationService, type MetadataApplicationService } from "../metadata/application/services";
import { PersistenceContainer } from "@sonafrik/persistence";
import {
  buildPipelineConfig,
  DEFAULT_PUBLICATION_FLAGS,
} from "./integration/feature-flags";
import {
  createPublicationOrchestratorWithService,
  type PublicationOrchestrator,
} from "./index";
import { InMemoryIdempotencyStore, InMemoryPublicationEventPublisher } from "./ports";
import { PUBLICATION_WORKFLOW_STEPS } from "./workflow";
import {
  ISRCReservationFailedError,
  MetadataIncompleteError,
  PublicationFailedError,
  PublicationValidationFailedError,
  RollbackFailedError,
  WorkflowConflictError,
} from "./errors";
import { mapToPublicationError } from "./errors";
import {
  publicationCancelledEvent,
  publicationPreparedEvent,
  publicationReadyEvent,
  publicationRequestedEvent,
  publicationValidatedEvent,
} from "./events";
import { PublicationTransaction } from "./transactions";
import { validatePreparePublicationRequest } from "./validators";
import { assertPublicationActor, assertPublicationOwnership } from "./ports";
import { createVerifyContextStep } from "./pipeline/steps/default-steps";
import type { PublicationPipelineStepHandler } from "./pipeline";

const actorId = randomUUID();
const correlationId = randomUUID();
const now = new Date().toISOString();

const defaultConfig = buildPipelineConfig({
  ...DEFAULT_PUBLICATION_FLAGS,
  orchestratorEnabled: true,
  metadataValidationEnabled: true,
});

function buildOrchestrator(): {
  orchestrator: PublicationOrchestrator;
  events: InMemoryPublicationEventPublisher;
  metadataService: MetadataApplicationService;
} {
  const events = new InMemoryPublicationEventPublisher();
  const metadataService = createInMemoryMetadataApplicationService();
  const container = new PersistenceContainer({ provider: "memory" });
  const orchestrator = createPublicationOrchestratorWithService(metadataService, container, events);
  return { orchestrator, events, metadataService };
}

async function seedTrackMetadata(
  metadataService: MetadataApplicationService,
): Promise<{ trackId: string; metadataId: string; creatorId: string }> {
  const trackId = randomUUID();
  const metadataId = randomUUID();
  await metadataService.executeCommand(
    { actorId, correlationId },
    {
      type: "CreateMetadata",
      payload: {
        id: metadataId,
        entityType: "track",
        entityId: trackId,
        status: "draft",
        source: "manual",
        visibility: "private",
        validationState: "pending",
        version: 1,
        createdAt: now,
        updatedAt: now,
      },
    },
  );
  return { trackId, metadataId, creatorId: actorId };
}

describe("PublicationOrchestrator integration", () => {
  it("prepares publication end-to-end (dry-run)", async () => {
    const { orchestrator, events, metadataService } = buildOrchestrator();
    const meta = await seedTrackMetadata(metadataService);

    const result = await orchestrator.preparePublication(
      { actorId, correlationId },
      {
        trackId: meta.trackId,
        metadataId: meta.metadataId,
        creatorId: meta.creatorId,
        proposedIsrc: "GNSFK2400001",
      },
      defaultConfig,
    );

    expect(result.status).toBe("ready");
    expect(result.dryRun).toBe(true);
    expect(result.package?.simulatedIsrc).toBe("GNSFK2400001");
    expect(result.package?.futureHooks).toContain("fingerprint");
    expect(result.steps).toHaveLength(PUBLICATION_WORKFLOW_STEPS.length);
    expect(events.events.some((e) => e.type === "PublicationReady")).toBe(true);
    expect(orchestrator.getPipelineSteps()).toEqual([...PUBLICATION_WORKFLOW_STEPS]);
  });

  it("rejects unauthorized creator", async () => {
    const { orchestrator, metadataService } = buildOrchestrator();
    const meta = await seedTrackMetadata(metadataService);
    await expect(
      orchestrator.preparePublication(
        { actorId: randomUUID(), correlationId },
        {
          trackId: meta.trackId,
          metadataId: meta.metadataId,
          creatorId: meta.creatorId,
        },
        defaultConfig,
      ),
    ).rejects.toMatchObject({ name: "PublicationNotAuthorizedError" });
  });

  it("rejects missing metadata", async () => {
    const { orchestrator } = buildOrchestrator();
    await expect(
      orchestrator.preparePublication(
        { actorId, correlationId },
        {
          trackId: randomUUID(),
          metadataId: randomUUID(),
          creatorId: actorId,
        },
        defaultConfig,
      ),
    ).rejects.toMatchObject({ name: "MetadataIncompleteError" });
  });

  it("enforces idempotency conflict", async () => {
    const idempotency = new InMemoryIdempotencyStore();
    const metadataService = createInMemoryMetadataApplicationService();
    const container = new PersistenceContainer({ provider: "memory" });
    const orchestrator = createPublicationOrchestratorWithService(
      metadataService,
      container,
      new InMemoryPublicationEventPublisher(),
      idempotency,
    );
    const meta = await seedTrackMetadata(metadataService);
    const key = "idem-1";
    await orchestrator.preparePublication(
      { actorId, correlationId, idempotencyKey: key },
      {
        trackId: meta.trackId,
        metadataId: meta.metadataId,
        creatorId: meta.creatorId,
      },
      defaultConfig,
    );
    await expect(
      orchestrator.preparePublication(
        { actorId, correlationId, idempotencyKey: key },
        {
          trackId: randomUUID(),
          metadataId: meta.metadataId,
          creatorId: meta.creatorId,
        },
        defaultConfig,
      ),
    ).rejects.toBeInstanceOf(WorkflowConflictError);
  });

  it("fails when pipeline completes without package", async () => {
    const { orchestrator, metadataService } = buildOrchestrator();
    const meta = await seedTrackMetadata(metadataService);
    const stubPipeline: PublicationPipelineStepHandler[] = [createVerifyContextStep()];
    Object.defineProperty(orchestrator, "pipeline", { value: stubPipeline });

    await expect(
      orchestrator.preparePublication(
        { actorId, correlationId },
        {
          trackId: meta.trackId,
          metadataId: meta.metadataId,
          creatorId: meta.creatorId,
        },
        defaultConfig,
      ),
    ).rejects.toBeInstanceOf(PublicationFailedError);
  });
});

describe("publication unit", () => {
  it("maps errors and builds events", () => {
    expect(mapToPublicationError(new Error("isrc bad")).name).toBe("ISRCReservationFailedError");
    expect(mapToPublicationError("x").name).toBe("PublicationFailedError");
    expect(publicationRequestedEvent(actorId, correlationId, "t", "m").type).toBe(
      "PublicationRequested",
    );
    expect(publicationValidatedEvent(actorId, correlationId, "m").type).toBe("PublicationValidated");
    expect(publicationPreparedEvent(actorId, correlationId, "m").type).toBe("PublicationPrepared");
    expect(publicationCancelledEvent(actorId, correlationId, "m", "r").type).toBe(
      "PublicationCancelled",
    );
    expect(publicationReadyEvent(actorId, correlationId, "m").type).toBe("PublicationReady");
    expect(new PublicationFailedError().name).toBe("PublicationFailedError");
    expect(new RollbackFailedError().name).toBe("RollbackFailedError");
    expect(new ISRCReservationFailedError().name).toBe("ISRCReservationFailedError");
    expect(new MetadataIncompleteError().name).toBe("MetadataIncompleteError");
    expect(new PublicationValidationFailedError().name).toBe("PublicationValidationFailedError");
  });

  it("validates request schema", () => {
    expect(() => validatePreparePublicationRequest({})).toThrow(PublicationValidationFailedError);
    const valid = validatePreparePublicationRequest({
      trackId: randomUUID(),
      metadataId: randomUUID(),
      creatorId: randomUUID(),
    });
    expect(valid.trackId).toBeDefined();
  });

  it("asserts publication context", () => {
    expect(() => assertPublicationActor({ actorId: " ", correlationId })).toThrow();
    expect(() =>
      assertPublicationOwnership({ actorId, correlationId }, randomUUID()),
    ).toThrow();
    expect(() =>
      assertPublicationOwnership({ actorId, correlationId, isAdmin: true }, randomUUID()),
    ).not.toThrow();
  });

  it("rolls back transaction on step failure", async () => {
    const tx = new PublicationTransaction();
    const failingStep: PublicationPipelineStepHandler = {
      stepId: "fail",
      order: 99,
      execute: async () => {
        throw new Error("boom");
      },
      rollback: async () => undefined,
    };
    await expect(
      tx.runStep(
        failingStep,
        async () => failingStep.execute({} as never),
        async () => undefined,
      ),
    ).rejects.toThrow("boom");
    expect(tx.getCompensationCount()).toBe(0);
  });

  it("verify context step rejects empty ids", async () => {
    const step = createVerifyContextStep();
    await expect(
      step.execute({
        ctx: { actorId, correlationId },
        request: { trackId: "", metadataId: "", creatorId: actorId },
        config: defaultConfig,
        metadata: null,
        simulatedIsrc: null,
        reservedIsrc: null,
        isrcSimulated: false,
        package: null,
        persistencePlan: null,
        cancelled: false,
        cancelReason: null,
      }),
    ).rejects.toThrow(PublicationValidationFailedError);
  });
});
