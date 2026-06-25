import { describe, expect, it, vi, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { ISRC_REGISTRY_STATUS } from "@sonafrik/types";
import { PersistenceContainer } from "@sonafrik/persistence";
import {
  DEFAULT_PUBLICATION_FLAGS,
  buildPipelineConfig,
  PUBLICATION_FEATURE_FLAGS,
  PublicationFeatureFlagResolver,
} from "./integration/feature-flags";
import { PublicationIntegrationService } from "./integration/publication-integration.service";
import { PublicationOrchestrator } from "./orchestrator";
import { createCatalogSubmitStep, createIsrcReservationStep, reserveIsrcForPublication } from "./integration/integration-steps";
import { createResolveMetadataStep } from "./integration/metadata-resolver";
import { resetPublicationTelemetry, getPublicationTelemetry } from "./observability";
import { createPublicationOrchestratorWithService } from "./index";
import { createInMemoryMetadataApplicationService } from "../metadata/application/services";
import { createInitialPipelineState } from "./pipeline/pipeline-state";
import { mapToPublicationError } from "./errors";

const trackId = randomUUID();
const creatorId = randomUUID();
const actorId = creatorId;

describe("PublicationIntegrationService", () => {
  beforeEach(() => {
    resetPublicationTelemetry();
    vi.restoreAllMocks();
  });

  it("uses legacy path when orchestrator flag disabled", async () => {
    const service = new PublicationIntegrationService({} as never);
    vi.spyOn(
      (service as unknown as { flagResolver: { resolve: () => Promise<unknown> } }).flagResolver,
      "resolve",
    ).mockResolvedValue(DEFAULT_PUBLICATION_FLAGS);

    let legacyCalled = false;
    const result = await service.submitTrack(trackId, async () => {
      legacyCalled = true;
    });

    expect(legacyCalled).toBe(true);
    expect(result.orchestratorUsed).toBe(false);
    expect(result.legacyExecuted).toBe(true);
  });

  it("runs orchestrator then legacy when flags enabled without real publish", async () => {
    const track = {
      id: trackId,
      creator_id: creatorId,
      title: "Track",
      publication_status: "draft",
    };
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: actorId } } }) },
    } as never;

    const service = new PublicationIntegrationService(client);
    vi.spyOn(
      (service as unknown as { repository: { getTrack: (id: string) => Promise<unknown> } })
        .repository,
      "getTrack",
    ).mockResolvedValue(track);
    vi.spyOn(
      (service as unknown as { flagResolver: PublicationFeatureFlagResolver }).flagResolver,
      "resolve",
    ).mockResolvedValue({
      orchestratorEnabled: true,
      metadataValidationEnabled: false,
      isrcReservationEnabled: false,
      persistenceEnabled: false,
      realPublishEnabled: false,
    });

    let legacyCount = 0;
    const result = await service.submitTrack(trackId, async () => {
      legacyCount += 1;
    });

    expect(result.orchestratorUsed).toBe(true);
    expect(legacyCount).toBe(1);
    expect(result.legacyExecuted).toBe(true);
  });

  it("builds progressive pipeline config from flags", () => {
    expect(buildPipelineConfig(DEFAULT_PUBLICATION_FLAGS).dryRun).toBe(true);
    expect(
      buildPipelineConfig({
        orchestratorEnabled: true,
        metadataValidationEnabled: true,
        isrcReservationEnabled: false,
        persistenceEnabled: true,
        realPublishEnabled: false,
      }).metadataValidation,
    ).toBe(true);
    expect(PUBLICATION_FEATURE_FLAGS.REAL_PUBLISH).toBe("publication_real_publish_enabled");
  });

  it("records telemetry metrics", () => {
    const telemetry = getPublicationTelemetry();
    telemetry.recordStart();
    telemetry.recordSuccess(12);
    telemetry.recordFailure(5);
    telemetry.recordRollback();
    telemetry.recordFlagCheck();
    expect(telemetry.snapshot().executions).toBe(1);
  });

  it("lazy-initializes telemetry singleton", async () => {
    vi.resetModules();
    const mod = await import("./observability/publication-telemetry");
    expect(mod.getPublicationTelemetry().snapshot().executions).toBe(0);
  });

  it("resolves feature flags from database client", async () => {
    const client = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { enabled: true }, error: null }),
      })),
    } as never;
    const resolver = new PublicationFeatureFlagResolver(client);
    const flags = await resolver.resolve();
    expect(flags.orchestratorEnabled).toBe(true);
    expect(flags.realPublishEnabled).toBe(true);
  });

  it("throws when track missing", async () => {
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: actorId } } }) },
    } as never;
    const service = new PublicationIntegrationService(client);
    vi.spyOn(
      (service as unknown as { flagResolver: { resolve: () => Promise<unknown> } }).flagResolver,
      "resolve",
    ).mockResolvedValue({
      ...DEFAULT_PUBLICATION_FLAGS,
      orchestratorEnabled: true,
    });
    vi.spyOn(
      (service as unknown as { repository: { getTrack: (id: string) => Promise<unknown> } })
        .repository,
      "getTrack",
    ).mockResolvedValue(null);

    await expect(
      service.submitTrack(trackId, async () => undefined),
    ).rejects.toThrow("Morceau introuvable");
  });

  it("submitAlbum orchestrates primary track when enabled", async () => {
    const service = new PublicationIntegrationService({} as never);
    vi.spyOn(
      (service as unknown as { flagResolver: { resolve: () => Promise<unknown> } }).flagResolver,
      "resolve",
    ).mockResolvedValue({
      ...DEFAULT_PUBLICATION_FLAGS,
      orchestratorEnabled: true,
    });
    vi.spyOn(
      (service as unknown as { repository: { ensureCreatorId: () => Promise<string> } }).repository,
      "ensureCreatorId",
    ).mockResolvedValue(creatorId);
    vi.spyOn(
      (service as unknown as {
        repository: { listTracks: (c: string, a: string) => Promise<unknown[]> };
      }).repository,
      "listTracks",
    ).mockResolvedValue([{ id: trackId }]);
    const submitTrackSpy = vi
      .spyOn(service, "submitTrack")
      .mockResolvedValue({
        orchestratorUsed: true,
        flags: DEFAULT_PUBLICATION_FLAGS,
        orchestratorResult: null,
        legacyExecuted: true,
        durationMs: 1,
      });

    let legacy = false;
    await service.submitAlbum(randomUUID(), async () => {
      legacy = true;
    });
    expect(submitTrackSpy).toHaveBeenCalled();
    expect(legacy).toBe(true);
  });

  it("submitAlbum with no tracks still runs legacy", async () => {
    const service = new PublicationIntegrationService({} as never);
    vi.spyOn(
      (service as unknown as { flagResolver: { resolve: () => Promise<unknown> } }).flagResolver,
      "resolve",
    ).mockResolvedValue({
      ...DEFAULT_PUBLICATION_FLAGS,
      orchestratorEnabled: true,
      realPublishEnabled: true,
    });
    vi.spyOn(
      (service as unknown as { repository: { ensureCreatorId: () => Promise<string> } }).repository,
      "ensureCreatorId",
    ).mockResolvedValue(creatorId);
    vi.spyOn(
      (service as unknown as {
        repository: { listTracks: (c: string, a: string) => Promise<unknown[]> };
      }).repository,
      "listTracks",
    ).mockResolvedValue([]);

    let legacy = false;
    const result = await service.submitAlbum(randomUUID(), async () => {
      legacy = true;
    });
    expect(legacy).toBe(true);
    expect(result.orchestratorUsed).toBe(true);
  });

  it("real publish skips duplicate legacy submit after orchestrator", async () => {
    const track = {
      id: trackId,
      creator_id: creatorId,
      title: "Track",
      publication_status: "draft",
    };
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: actorId } } }) },
    } as never;

    const service = new PublicationIntegrationService(client);
    vi.spyOn(
      (service as unknown as { repository: { getTrack: (id: string) => Promise<unknown> } })
        .repository,
      "getTrack",
    ).mockResolvedValue(track);
    vi.spyOn(
      (service as unknown as { flagResolver: PublicationFeatureFlagResolver }).flagResolver,
      "resolve",
    ).mockResolvedValue({
      orchestratorEnabled: true,
      metadataValidationEnabled: false,
      isrcReservationEnabled: false,
      persistenceEnabled: false,
      realPublishEnabled: true,
    });

    let legacyCount = 0;
    const result = await service.submitTrack(trackId, async () => {
      legacyCount += 1;
    });

    expect(result.orchestratorUsed).toBe(true);
    expect(legacyCount).toBe(1);
    expect(result.legacyExecuted).toBe(true);
  });

  it("records failure when orchestrator throws", async () => {
    const track = {
      id: trackId,
      creator_id: creatorId,
      title: "Track",
      publication_status: "draft",
    };
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: actorId } } }) },
    } as never;
    const service = new PublicationIntegrationService(client);
    vi.spyOn(
      (service as unknown as { repository: { getTrack: (id: string) => Promise<unknown> } })
        .repository,
      "getTrack",
    ).mockResolvedValue(track);
    vi.spyOn(
      (service as unknown as { flagResolver: PublicationFeatureFlagResolver }).flagResolver,
      "resolve",
    ).mockResolvedValue({
      orchestratorEnabled: true,
      metadataValidationEnabled: false,
      isrcReservationEnabled: false,
      persistenceEnabled: false,
      realPublishEnabled: false,
    });
    vi.spyOn(PublicationOrchestrator.prototype, "preparePublication").mockRejectedValue(
      new Error("pipeline boom"),
    );

    await expect(
      service.submitTrack(trackId, async () => undefined),
    ).rejects.toThrow("pipeline boom");
    expect(getPublicationTelemetry().snapshot().rollbacks).toBeGreaterThan(0);
  });

  it("defaultFlags returns disabled state", () => {
    expect(PublicationIntegrationService.defaultFlags().orchestratorEnabled).toBe(false);
  });

  it("submitAlbum uses legacy when orchestrator disabled", async () => {
    const service = new PublicationIntegrationService({} as never);
    vi.spyOn(
      (service as unknown as { flagResolver: { resolve: () => Promise<unknown> } }).flagResolver,
      "resolve",
    ).mockResolvedValue(DEFAULT_PUBLICATION_FLAGS);
    let called = false;
    await service.submitAlbum(randomUUID(), async () => {
      called = true;
    });
    expect(called).toBe(true);
  });
});

describe("integration steps", () => {
  it("resolve metadata creates record when persistence enabled", async () => {
    const metadataService = createInMemoryMetadataApplicationService();
    const step = createResolveMetadataStep(metadataService);
    const tid = randomUUID();
    const state = createInitialPipelineState(
      { actorId, correlationId: randomUUID() },
      { trackId: tid, metadataId: tid, creatorId: actorId },
      buildPipelineConfig({
        ...DEFAULT_PUBLICATION_FLAGS,
        persistenceEnabled: true,
      }),
    );
    const next = await step.execute(state);
    expect(next.metadata).not.toBeNull();
  });

  it("reserve ISRC fails gracefully on empty registry", async () => {
    const container = new PersistenceContainer({ provider: "memory" });
    const ports = {
      repositories: container.getRepositories(),
      transactionManager: container.getTransactionManager(),
    };
    await expect(
      reserveIsrcForPublication(ports, actorId, randomUUID(), "GNSFK2400001"),
    ).rejects.toThrow();
  });

  it("reserves ISRC when flag enabled and entry available", async () => {
    const container = new PersistenceContainer({ provider: "memory" });
    await container.getRepositories().isrc.saveEntry(
      {
        isrc: "GNSFK2400001" as never,
        status: ISRC_REGISTRY_STATUS.AVAILABLE,
        metadataId: null,
        trackId: null,
        reservedBy: null,
        reservedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { actorId, correlationId: randomUUID(), initiatedAt: new Date().toISOString() },
    );
    const ports = {
      repositories: container.getRepositories(),
      transactionManager: container.getTransactionManager(),
    };
    const state = createInitialPipelineState(
      { actorId, correlationId: randomUUID() },
      {
        trackId: randomUUID(),
        metadataId: randomUUID(),
        creatorId: actorId,
        proposedIsrc: "GNSFK2400001",
      },
      buildPipelineConfig({ ...DEFAULT_PUBLICATION_FLAGS, isrcReservationEnabled: true }),
    );
    const next = await createIsrcReservationStep(ports).execute(state);
    expect(next.reservedIsrc).toBe("GNSFK2400001");
  });

  it("catalog submit invokes legacy when real publish enabled", async () => {
    let legacy = false;
    const state = createInitialPipelineState(
      { actorId, correlationId: randomUUID() },
      { trackId: randomUUID(), metadataId: randomUUID(), creatorId: actorId },
      buildPipelineConfig({ ...DEFAULT_PUBLICATION_FLAGS, realPublishEnabled: true }),
      async () => {
        legacy = true;
      },
    );
    await createCatalogSubmitStep().execute(state);
    expect(legacy).toBe(true);
  });

  it("maps unknown errors to publication failed", () => {
    expect(mapToPublicationError(42).message).toBe("Erreur publication inconnue");
  });

  it("maps generic Error without isrc keyword", () => {
    expect(mapToPublicationError(new Error("timeout")).name).toBe("PublicationFailedError");
  });
});

describe("PublicationOrchestrator Phase 5 config", () => {
  it("runs dry-run pipeline with memory provider", async () => {
    const container = new PersistenceContainer({ provider: "memory" });
    const metadataService = createInMemoryMetadataApplicationService();
    const orchestrator = createPublicationOrchestratorWithService(metadataService, container);
    const now = new Date().toISOString();
    const metadataId = randomUUID();
    const tid = randomUUID();

    await metadataService.executeCommand(
      { actorId, correlationId: randomUUID() },
      {
        type: "CreateMetadata",
        payload: {
          id: metadataId,
          entityType: "track",
          entityId: tid,
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

    const config = buildPipelineConfig({
      orchestratorEnabled: true,
      metadataValidationEnabled: true,
      isrcReservationEnabled: false,
      persistenceEnabled: false,
      realPublishEnabled: false,
    });

    const result = await orchestrator.preparePublication(
      { actorId, correlationId: randomUUID() },
      { trackId: tid, metadataId, creatorId: actorId },
      config,
    );

    expect(result.dryRun).toBe(true);
    expect(result.package?.trackId).toBe(tid);
  });
});
