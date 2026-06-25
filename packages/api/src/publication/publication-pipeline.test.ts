import { describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PersistenceContainer } from "@sonafrik/persistence";
import {
  ApplicationConflictError,
  ApplicationError,
  ApplicationNotFoundError,
  NotAuthorizedError,
  ValidationFailedError,
} from "../metadata/application/errors";
import { createInMemoryMetadataApplicationService } from "../metadata/application/services";
import { buildPipelineConfig, DEFAULT_PUBLICATION_FLAGS } from "./integration/feature-flags";
import { createResolveMetadataStep } from "./integration/metadata-resolver";
import { createCatalogSubmitStep, createIsrcReservationStep } from "./integration/integration-steps";
import { mapToPublicationError } from "./errors";
import { createDefaultPublicationPipeline, createPublicationPipelineRegistry } from "./pipeline";
import { executeWithRollback } from "./transactions";
import { PublicationTransaction } from "./transactions/publication-transaction";
import {
  createBuildPackageStep,
  createPreparePersistenceStep,
  createValidateDependenciesStep,
  createValidateMetadataStep,
} from "./pipeline/steps/default-steps";
import { createInitialPipelineState } from "./pipeline/pipeline-state";

const defaultConfig = buildPipelineConfig(DEFAULT_PUBLICATION_FLAGS);

function pipelinePorts() {
  const container = new PersistenceContainer({ provider: "memory" });
  return {
    metadataService: createInMemoryMetadataApplicationService(),
    ports: {
      repositories: container.getRepositories(),
      transactionManager: container.getTransactionManager(),
    },
  };
}

describe("publication pipeline", () => {
  it("registers pipeline steps in order", () => {
    const { metadataService, ports } = pipelinePorts();
    const steps = createDefaultPublicationPipeline(metadataService, ports);
    const registry = createPublicationPipelineRegistry(steps);
    expect(registry.get("verify-context")?.order).toBe(1);
    expect(steps[steps.length - 1]?.stepId).toBe("catalog-submit");
  });

  it("maps all application error variants", () => {
    expect(mapToPublicationError(new ValidationFailedError("v")).name).toBe(
      "PublicationValidationFailedError",
    );
    expect(mapToPublicationError(new ApplicationNotFoundError("n")).name).toBe(
      "MetadataIncompleteError",
    );
    expect(mapToPublicationError(new ApplicationConflictError("c")).name).toBe(
      "WorkflowConflictError",
    );
    expect(mapToPublicationError(new NotAuthorizedError("a")).name).toBe(
      "PublicationNotAuthorizedError",
    );
    expect(mapToPublicationError(new ApplicationError("application_unknown")).name).toBe(
      "PublicationFailedError",
    );
    expect(mapToPublicationError(new Error("network fail")).name).toBe("PublicationFailedError");
  });

  it("executes step rollbacks and dependency validation", async () => {
    const ctx = { actorId: randomUUID(), correlationId: randomUUID() };
    const request = {
      trackId: randomUUID(),
      metadataId: randomUUID(),
      creatorId: ctx.actorId,
    };
    let state = createInitialPipelineState(ctx, request, defaultConfig);
    state = {
      ...state,
      metadata: {
        id: request.metadataId,
        entityType: "track",
        entityId: request.trackId,
        status: "draft",
        source: "manual",
        visibility: "private",
        validationState: "pending",
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      simulatedIsrc: "GNSFK2400001",
      isrcSimulated: true,
    };
    state = await createBuildPackageStep().execute(state);
    expect(state.package?.dryRun).toBe(true);
    await createBuildPackageStep().rollback(state);

    const { ports } = pipelinePorts();
    state = await createIsrcReservationStep(ports).execute(
      createInitialPipelineState(ctx, request, defaultConfig),
    );
    await createIsrcReservationStep(ports).rollback(state);
    expect(state.isrcSimulated).toBe(false);

    const badDeps = {
      ...state,
      config: { ...defaultConfig, metadataValidation: true },
      package: state.package,
      metadata: state.metadata
        ? { ...state.metadata, entityId: randomUUID() }
        : null,
    };
    await expect(createValidateDependenciesStep().execute(badDeps)).rejects.toThrow();

    state = await createPreparePersistenceStep().execute({
      ...createInitialPipelineState(ctx, request, defaultConfig),
      package: {
        trackId: request.trackId,
        metadataId: request.metadataId,
        creatorId: ctx.actorId,
        simulatedIsrc: "GNSFK2400001",
        reservedIsrc: null,
        dryRun: true,
        preparedAt: new Date().toISOString(),
        futureHooks: [],
      },
    });
    expect(state.persistencePlan?.mode).toBe("dry-run");
    await createPreparePersistenceStep().rollback(state);
  });

  it("validate metadata rejects deleted and non-track records", async () => {
    const metadataService = createInMemoryMetadataApplicationService();
    const metadataId = randomUUID();
    const trackId = randomUUID();
    const actor = randomUUID();
    await metadataService.executeCommand(
      { actorId: actor, correlationId: randomUUID() },
      {
        type: "CreateMetadata",
        payload: {
          id: metadataId,
          entityType: "album",
          entityId: randomUUID(),
          status: "draft",
          source: "manual",
          visibility: "private",
          validationState: "pending",
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    );
    const step = createValidateMetadataStep(metadataService);
    await expect(
      step.execute(
        createInitialPipelineState(
          { actorId: actor, correlationId: randomUUID() },
          { trackId, metadataId, creatorId: actor },
          { ...defaultConfig, metadataValidation: true },
        ),
      ),
    ).rejects.toThrow("Seules les métadonnées track");

    await expect(
      step.execute(
        createInitialPipelineState(
          { actorId: actor, correlationId: randomUUID() },
          { trackId, metadataId: randomUUID(), creatorId: actor },
          { ...defaultConfig, metadataValidation: true },
        ),
      ),
    ).rejects.toThrow("Métadonnées introuvables");
  });

  it("skips validation when metadataValidation disabled", async () => {
    const metadataService = createInMemoryMetadataApplicationService();
    const step = createValidateMetadataStep(metadataService);
    const next = await step.execute(
      createInitialPipelineState(
        { actorId: randomUUID(), correlationId: randomUUID() },
        { trackId: randomUUID(), metadataId: randomUUID(), creatorId: randomUUID() },
        defaultConfig,
      ),
    );
    expect(next.metadata).toBeNull();
  });

  it("prepare persistence plans writes when persistence and isrc enabled", async () => {
    const ctx = { actorId: randomUUID(), correlationId: randomUUID() };
    const request = { trackId: randomUUID(), metadataId: randomUUID(), creatorId: ctx.actorId };
    const metadata = {
      id: request.metadataId,
      entityType: "track" as const,
      entityId: request.trackId,
      status: "draft" as const,
      source: "manual" as const,
      visibility: "private" as const,
      validationState: "pending" as const,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const state = await createPreparePersistenceStep().execute({
      ...createInitialPipelineState(ctx, request, {
        ...defaultConfig,
        persistence: true,
        isrcReservation: true,
      }),
      package: {
        trackId: request.trackId,
        metadataId: request.metadataId,
        creatorId: ctx.actorId,
        simulatedIsrc: null,
        reservedIsrc: "GNSFK2400001",
        dryRun: false,
        preparedAt: new Date().toISOString(),
        futureHooks: [],
      },
      metadata,
      reservedIsrc: "GNSFK2400001",
    });
    expect(state.persistencePlan?.writes).toContain("metadata.upsert");
    expect(state.persistencePlan?.writes).toContain("isrc.reserve");
  });

  it("resolve metadata returns existing record", async () => {
    const metadataService = createInMemoryMetadataApplicationService();
    const trackId = randomUUID();
    const metadataId = randomUUID();
    const actor = randomUUID();
    const found = {
      id: metadataId,
      entityType: "track" as const,
      entityId: trackId,
      status: "draft" as const,
      source: "manual" as const,
      visibility: "private" as const,
      validationState: "pending" as const,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    vi.spyOn(metadataService, "executeQuery").mockResolvedValueOnce(found);

    const next = await createResolveMetadataStep(metadataService).execute(
      createInitialPipelineState(
        { actorId: actor, correlationId: randomUUID() },
        { trackId, metadataId, creatorId: actor },
        { ...defaultConfig, persistence: true },
      ),
    );
    expect(next.metadata?.id).toBe(metadataId);
  });

  it("rejects invalid proposed ISRC format", async () => {
    const { ports } = pipelinePorts();
    await expect(
      createIsrcReservationStep(ports).execute(
        createInitialPipelineState(
          { actorId: randomUUID(), correlationId: randomUUID() },
          {
            trackId: randomUUID(),
            metadataId: randomUUID(),
            creatorId: randomUUID(),
            proposedIsrc: "INVALID",
          },
          { ...defaultConfig, isrcReservation: true },
        ),
      ),
    ).rejects.toThrow("Format ISRC proposé invalide");
  });

  it("catalog submit rollback is a no-op", async () => {
    await expect(createCatalogSubmitStep().rollback({} as never)).resolves.toBeUndefined();
  });

  it("validate dependencies skips when metadataValidation disabled", async () => {
    const next = await createValidateDependenciesStep().execute(
      createInitialPipelineState(
        { actorId: randomUUID(), correlationId: randomUUID() },
        { trackId: randomUUID(), metadataId: randomUUID(), creatorId: randomUUID() },
        defaultConfig,
      ),
    );
    expect(next.package).toBeNull();
  });

  it("prepare persistence requires package", async () => {
    await expect(
      createPreparePersistenceStep().execute(
        createInitialPipelineState(
          { actorId: randomUUID(), correlationId: randomUUID() },
          { trackId: randomUUID(), metadataId: randomUUID(), creatorId: randomUUID() },
          defaultConfig,
        ),
      ),
    ).rejects.toThrow("Package requis");
  });

  it("validate metadata rejects archived records", async () => {
    const metadataService = createInMemoryMetadataApplicationService();
    const metadataId = randomUUID();
    const trackId = randomUUID();
    await metadataService.executeCommand(
      { actorId: randomUUID(), correlationId: randomUUID() },
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    );
    await metadataService.executeCommand(
      { actorId: randomUUID(), correlationId: randomUUID() },
      { type: "ArchiveMetadata", metadataId },
    );
    const step = createValidateMetadataStep(metadataService);
    await expect(
      step.execute(
        createInitialPipelineState(
          { actorId: randomUUID(), correlationId: randomUUID() },
          { trackId, metadataId, creatorId: randomUUID() },
          { ...defaultConfig, metadataValidation: true },
        ),
      ),
    ).rejects.toThrow();
  });

  it("transaction rollback reports partial failures", async () => {
    const tx = new PublicationTransaction();
    const step = {
      stepId: "ok",
      order: 1,
      execute: async () => "done",
      rollback: async () => {
        throw new Error("rollback fail");
      },
    };
    await tx.runStep(step, async () => "ok", step.rollback);
    await expect(tx.rollbackAll()).rejects.toMatchObject({ name: "RollbackFailedError" });
  });

  it("executeWithRollback delegates to transaction", async () => {
    const tx = new PublicationTransaction();
    const step = { stepId: "s", order: 1, execute: async () => ({}), rollback: async () => {} };
    const value = await executeWithRollback(
      tx,
      step,
      async () => 42,
      async () => undefined,
    );
    expect(value).toBe(42);
  });
});
