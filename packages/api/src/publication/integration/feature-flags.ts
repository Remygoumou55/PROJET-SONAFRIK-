import { AdminConfigRepository } from "../../admin/admin.config.repository";
import type { SonafrikSupabaseClient } from "@sonafrik/database";

/** Internal publication feature flags — progressive rollout Phase 5 */
export const PUBLICATION_FEATURE_FLAGS = {
  ORCHESTRATOR_ENABLED: "publication_orchestrator_enabled",
  METADATA_VALIDATION: "metadata_validation_enabled",
  ISRC_RESERVATION: "isrc_reservation_enabled",
  PERSISTENCE: "publication_persistence_enabled",
  REAL_PUBLISH: "publication_real_publish_enabled",
} as const;

export interface PublicationFeatureFlagState {
  readonly orchestratorEnabled: boolean;
  readonly metadataValidationEnabled: boolean;
  readonly isrcReservationEnabled: boolean;
  readonly persistenceEnabled: boolean;
  readonly realPublishEnabled: boolean;
}

export const DEFAULT_PUBLICATION_FLAGS: PublicationFeatureFlagState = {
  orchestratorEnabled: false,
  metadataValidationEnabled: false,
  isrcReservationEnabled: false,
  persistenceEnabled: false,
  realPublishEnabled: false,
};

export class PublicationFeatureFlagResolver {
  private readonly config: AdminConfigRepository;

  constructor(client: SonafrikSupabaseClient) {
    this.config = new AdminConfigRepository(client);
  }

  async resolve(): Promise<PublicationFeatureFlagState> {
    const [orchestratorEnabled, metadataValidationEnabled, isrcReservationEnabled, persistenceEnabled, realPublishEnabled] =
      await Promise.all([
        this.config.isFeatureEnabled(PUBLICATION_FEATURE_FLAGS.ORCHESTRATOR_ENABLED),
        this.config.isFeatureEnabled(PUBLICATION_FEATURE_FLAGS.METADATA_VALIDATION),
        this.config.isFeatureEnabled(PUBLICATION_FEATURE_FLAGS.ISRC_RESERVATION),
        this.config.isFeatureEnabled(PUBLICATION_FEATURE_FLAGS.PERSISTENCE),
        this.config.isFeatureEnabled(PUBLICATION_FEATURE_FLAGS.REAL_PUBLISH),
      ]);

    return {
      orchestratorEnabled,
      metadataValidationEnabled,
      isrcReservationEnabled,
      persistenceEnabled,
      realPublishEnabled,
    };
  }
}

export function buildPipelineConfig(
  flags: PublicationFeatureFlagState,
): PublicationPipelineConfig {
  return {
    dryRun: !flags.persistenceEnabled,
    metadataValidation: flags.metadataValidationEnabled,
    isrcReservation: flags.isrcReservationEnabled,
    persistence: flags.persistenceEnabled,
    realPublish: flags.realPublishEnabled,
  };
}

export interface PublicationPipelineConfig {
  readonly dryRun: boolean;
  readonly metadataValidation: boolean;
  readonly isrcReservation: boolean;
  readonly persistence: boolean;
  readonly realPublish: boolean;
}
