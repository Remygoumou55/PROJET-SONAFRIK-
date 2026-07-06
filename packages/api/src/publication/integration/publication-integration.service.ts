import { newRandomId } from "../utils/random-id";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { createPersistenceContainer } from "@sonafrik/persistence";
import { createSupabaseClientPort } from "@sonafrik/persistence/adapters/supabase";
import { createMetadataApplicationService } from "../../metadata/application/services";
import { CatalogRepository } from "../../creator/catalog/catalog.repository";
import { PublicationOrchestrator } from "../orchestrator";
import {
  buildPipelineConfig,
  DEFAULT_PUBLICATION_FLAGS,
  PublicationFeatureFlagResolver,
  type PublicationFeatureFlagState,
} from "./feature-flags";
import { getPublicationTelemetry } from "../observability";
import type { PublicationPreparedResultDto } from "../dto";

export interface PublicationIntegrationResult {
  readonly orchestratorUsed: boolean;
  readonly flags: PublicationFeatureFlagState;
  readonly orchestratorResult: PublicationPreparedResultDto | null;
  readonly legacyExecuted: boolean;
  readonly durationMs: number;
}

/** Bridges Creator Catalog → Publication Orchestrator (Phase 5) */
export class PublicationIntegrationService {
  private readonly flagResolver: PublicationFeatureFlagResolver;
  private readonly repository: CatalogRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.flagResolver = new PublicationFeatureFlagResolver(client);
    this.repository = new CatalogRepository(client);
  }

  async submitTrack(
    trackId: string,
    legacySubmit: () => Promise<void>,
  ): Promise<PublicationIntegrationResult> {
    const telemetry = getPublicationTelemetry();
    const started = Date.now();
    telemetry.recordStart();

    const flags = await this.flagResolver.resolve();
    telemetry.recordFlagCheck();

    if (!flags.orchestratorEnabled) {
      await legacySubmit();
      telemetry.recordSuccess(Date.now() - started);
      return {
        orchestratorUsed: false,
        flags,
        orchestratorResult: null,
        legacyExecuted: true,
        durationMs: Date.now() - started,
      };
    }

    const {
      data: { user },
    } = await this.client.auth.getUser();
    const actorId = user?.id ?? "system";
    const track = await this.repository.getTrack(trackId);
    if (!track) {
      telemetry.recordFailure(Date.now() - started);
      throw new Error("Morceau introuvable");
    }

    const container = createPersistenceContainer({
      provider: flags.persistenceEnabled ? "supabase" : "memory",
      supabaseClient: flags.persistenceEnabled
        ? createSupabaseClientPort(
            this.client as unknown as Parameters<typeof createSupabaseClientPort>[0],
          )
        : undefined,
    });

    const metadataService = createMetadataApplicationService(container);
    const metadataPorts = {
      repositories: container.getRepositories(),
      transactionManager: container.getTransactionManager(),
    };
    const orchestrator = new PublicationOrchestrator(
      { metadataService },
      metadataPorts,
    );

    const config = buildPipelineConfig(flags);
    const correlationId = newRandomId();

    let orchestratorResult: PublicationPreparedResultDto | null = null;
    try {
      orchestratorResult = await orchestrator.preparePublication(
        {
          actorId,
          correlationId,
          idempotencyKey: `track-submit:${trackId}`,
        },
        {
          trackId,
          metadataId: trackId,
          creatorId: track.creator_id,
        },
        config,
        legacySubmit,
      );
    } catch (error) {
      telemetry.recordFailure(Date.now() - started);
      telemetry.recordRollback();
      throw error;
    }

    let legacyExecuted = false;
    if (!flags.realPublishEnabled) {
      await legacySubmit();
      legacyExecuted = true;
    } else {
      legacyExecuted = true;
    }

    telemetry.recordSuccess(Date.now() - started);
    return {
      orchestratorUsed: true,
      flags,
      orchestratorResult,
      legacyExecuted,
      durationMs: Date.now() - started,
    };
  }

  async submitAlbum(
    albumId: string,
    legacySubmit: () => Promise<void>,
  ): Promise<PublicationIntegrationResult> {
    const flags = await this.flagResolver.resolve();
    if (!flags.orchestratorEnabled) {
      await legacySubmit();
      return {
        orchestratorUsed: false,
        flags,
        orchestratorResult: null,
        legacyExecuted: true,
        durationMs: 0,
      };
    }

    const tracks = await this.repository.listTracks(
      (await this.repository.ensureCreatorId()),
      albumId,
    );
    const primaryTrack = tracks[0];
    if (primaryTrack) {
      try {
        await this.submitTrack(primaryTrack.id, async () => undefined);
      } catch {
        /* album orchestration is best-effort until step 5 */
      }
    }

    if (!flags.realPublishEnabled) {
      await legacySubmit();
    } else {
      await legacySubmit();
    }

    return {
      orchestratorUsed: true,
      flags,
      orchestratorResult: null,
      legacyExecuted: true,
      durationMs: 0,
    };
  }

  static defaultFlags(): PublicationFeatureFlagState {
    return DEFAULT_PUBLICATION_FLAGS;
  }
}
