import { SRTSP_DOMAIN_EVENTS } from "../registry/domain-events";
import type { SrtspPublishInput } from "../types";

/** Contexte minimal — Publication Wizard → SRTSP (Phase 3.1). */
export interface PublicationWizardContext {
  albumId: string;
  trackId: string;
  creatorId: string;
  title?: string;
}

export type PublicationWizardPublishFn = (
  input: SrtspPublishInput<Record<string, unknown>>,
) => void;

/** Cartographie officielle action wizard → événement SRTSP. */
export const PUBLICATION_WIZARD_EVENT_MAP = {
  step1_createRelease: SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_CREATED,
  step1_resaveDraft: SRTSP_DOMAIN_EVENTS.PUBLICATION_DRAFT_UPDATED,
  step2_audioUploaded: SRTSP_DOMAIN_EVENTS.PUBLICATION_AUDIO_UPLOADED,
  step2_coverUploaded: SRTSP_DOMAIN_EVENTS.PUBLICATION_COVER_UPLOADED,
  step3_metadataCompleted: SRTSP_DOMAIN_EVENTS.PUBLICATION_METADATA_COMPLETED,
  step4_submitted: SRTSP_DOMAIN_EVENTS.PUBLICATION_SUBMITTED,
  user_cancelled: SRTSP_DOMAIN_EVENTS.PUBLICATION_CANCELLED,
  publication_deleted: SRTSP_DOMAIN_EVENTS.PUBLICATION_DELETED,
} as const;

function buildPayload(ctx: PublicationWizardContext): Record<string, unknown> {
  return {
    albumId: ctx.albumId,
    trackId: ctx.trackId,
    creatorId: ctx.creatorId,
    ...(ctx.title ? { title: ctx.title } : {}),
  };
}

function buildDedupeKey(scope: string, ctx: PublicationWizardContext): string {
  return `publication-wizard:${scope}:${ctx.albumId}:${ctx.trackId}:${Date.now()}`;
}

/** Adaptateur d'émission — Wizard agnostique des modules consommateurs. */
export function createPublicationWizardPublisher(publish: PublicationWizardPublishFn) {
  const emit = (name: string, ctx: PublicationWizardContext, scope: string) => {
    publish({
      name,
      source: "publication",
      payload: buildPayload(ctx),
      dedupeKey: buildDedupeKey(scope, ctx),
      metadata: { channel: "publication-wizard", scope },
    });
  };

  return {
    draftCreated(ctx: PublicationWizardContext) {
      emit(PUBLICATION_WIZARD_EVENT_MAP.step1_createRelease, ctx, "draft-created");
    },
    draftUpdated(ctx: PublicationWizardContext) {
      emit(PUBLICATION_WIZARD_EVENT_MAP.step1_resaveDraft, ctx, "draft-updated");
    },
    audioUploaded(ctx: PublicationWizardContext) {
      emit(PUBLICATION_WIZARD_EVENT_MAP.step2_audioUploaded, ctx, "audio-uploaded");
    },
    coverUploaded(ctx: PublicationWizardContext) {
      emit(PUBLICATION_WIZARD_EVENT_MAP.step2_coverUploaded, ctx, "cover-uploaded");
    },
    metadataCompleted(ctx: PublicationWizardContext) {
      emit(PUBLICATION_WIZARD_EVENT_MAP.step3_metadataCompleted, ctx, "metadata-completed");
    },
    submitted(ctx: PublicationWizardContext) {
      emit(PUBLICATION_WIZARD_EVENT_MAP.step4_submitted, ctx, "submitted");
    },
    cancelled(ctx: PublicationWizardContext) {
      emit(PUBLICATION_WIZARD_EVENT_MAP.user_cancelled, ctx, "cancelled");
    },
    deleted(ctx: PublicationWizardContext) {
      emit(PUBLICATION_WIZARD_EVENT_MAP.publication_deleted, ctx, "deleted");
    },
  };
}

export type PublicationWizardPublisher = ReturnType<typeof createPublicationWizardPublisher>;
