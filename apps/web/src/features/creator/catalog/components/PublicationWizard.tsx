"use client";

import dynamic from "next/dynamic";
import { WizardProgress } from "./WizardProgress";
import { WizardPublishedSuccess } from "./WizardPublishedSuccess";
import { WizardStep1Panel } from "./WizardStep1Panel";
import { WizardStep3Panel } from "./WizardStep3Panel";
import { WizardStep4Panel } from "./WizardStep4Panel";
import { usePublicationWizardFlow } from "../hooks/usePublicationWizardFlow";

const WizardStep2Panel = dynamic(
  () => import("./WizardStep2Panel").then((mod) => ({ default: mod.WizardStep2Panel })),
  {
    ssr: false,
    loading: () => (
      <div className="pub-wiz__step-loading" aria-busy="true">
        Préparation des uploaders…
      </div>
    ),
  },
);

interface Props {
  creatorId: string;
  stageName: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function PublicationWizard({ creatorId, stageName, onComplete, onCancel }: Props) {
  const flow = usePublicationWizardFlow({ creatorId, stageName, onCancel });

  if (flow.published) {
    return (
      <WizardPublishedSuccess title={flow.release?.title ?? "Votre morceau"} onComplete={onComplete} />
    );
  }

  return (
    <div className="pub-wiz">
      <WizardProgress
        step={flow.step}
        maxValidatedStep={flow.maxValidatedStep}
        onStepSelect={flow.goToStep}
      />

      {flow.error && (
        <p className="pub-wiz__error" role="alert">{flow.error}</p>
      )}

      {flow.step === 1 && (
        <WizardStep1Panel
          titleInput={flow.titleInput}
          creating={flow.creating}
          onTitleChange={flow.setTitleInput}
          onSubmit={(e) => void flow.handleCreateRelease(e)}
          onGoBack={flow.goBack}
        />
      )}

      {flow.step2Mounted && flow.release && (
        <WizardStep2Panel
          hidden={flow.step !== 2}
          release={flow.release}
          uploadCreatorId={flow.uploadCreatorId ?? flow.release.creatorId}
          audioRef={flow.audioRef}
          coverRef={flow.coverRef}
          uploading2={flow.uploading2}
          audioReady={flow.audioReady}
          onGoBack={flow.goBack}
          onContinue={() => void flow.handleContinueStep2()}
          onAudioReady={() => flow.setAudioReady(true)}
          onAudioCleared={() => {
            flow.setAudioReady(false);
            if (flow.filesCompleted) flow.setFilesCompleted(false);
          }}
          onCoverCleared={() => {
            if (flow.filesCompleted) flow.setFilesCompleted(false);
            flow.invalidateCoverPreview();
          }}
          onCoverSuccess={() => flow.invalidateCoverPreview()}
        />
      )}

      {flow.step === 3 && flow.release && (
        <WizardStep3Panel
          meta={flow.meta}
          genres={flow.genres}
          genresError={flow.genresError}
          savingMeta={flow.savingMeta}
          onMetaChange={(patch) => flow.setMeta((m) => ({ ...m, ...patch }))}
          onRetryGenres={flow.loadGenres}
          onGoBack={flow.goBack}
          onContinue={() => void flow.handleSaveMeta()}
        />
      )}

      {flow.step === 4 && flow.release && (
        <WizardStep4Panel
          release={flow.release}
          stageName={stageName}
          genreLabel={flow.genreLabel}
          languageLabel={flow.languageLabel}
          coverPreviewUrl={flow.coverPreviewUrl}
          publishing={flow.publishing}
          onBackToMeta={() => flow.goToStep(3)}
          onPublish={() => void flow.handlePublish()}
        />
      )}
    </div>
  );
}
