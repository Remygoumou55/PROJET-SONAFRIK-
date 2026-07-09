"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import type { AudioUploaderHandle } from "./AudioUploader";
import type { CoverUploaderHandle } from "./CoverUploader";

const AudioUploader = dynamic(
  () => import("./AudioUploader").then((m) => ({ default: m.AudioUploader })),
  {
    ssr: false,
    loading: () => <div className="pub-wiz__step-loading" aria-busy="true" />,
  },
);

const CoverUploader = dynamic(
  () => import("./CoverUploader").then((m) => ({ default: m.CoverUploader })),
  {
    ssr: false,
    loading: () => <div className="pub-wiz__step-loading" aria-busy="true" />,
  },
);

export interface WizardStep2PanelProps {
  hidden: boolean;
  release: {
    trackId: string;
    albumId: string;
    creatorId: string;
  };
  uploadCreatorId: string;
  audioRef: RefObject<AudioUploaderHandle | null>;
  coverRef: RefObject<CoverUploaderHandle | null>;
  uploading2: boolean;
  audioReady: boolean;
  onGoBack: () => void;
  onContinue: () => void;
  onAudioReady: () => void;
  onAudioCleared: () => void;
  onCoverCleared: () => void;
  onCoverSuccess: () => void;
}

export function WizardStep2Panel({
  hidden,
  release,
  uploadCreatorId,
  audioRef,
  coverRef,
  uploading2,
  audioReady,
  onGoBack,
  onContinue,
  onAudioReady,
  onAudioCleared,
  onCoverCleared,
  onCoverSuccess,
}: WizardStep2PanelProps) {
  const canContinue = !uploading2 && audioReady;

  const body = (
    <div className="pub-wiz__body pub-wiz__body--step2">
      <div className="pub-wiz__card pub-wiz__card--compact">
        <h3 className="pub-wiz__card-title">Fichier audio</h3>
        <p className="pub-wiz__card-sub">Choisissez le morceau à publier.</p>
        <div className="pub-wiz__upload-slot">
          <AudioUploader
            ref={audioRef}
            trackId={release.trackId}
            creatorId={uploadCreatorId}
            onFileReady={onAudioReady}
            onFileCleared={onAudioCleared}
          />
        </div>
      </div>

      <div className="pub-wiz__card pub-wiz__card--compact">
        <h3 className="pub-wiz__card-title">Pochette</h3>
        <p className="pub-wiz__card-sub">
          Optionnel — SONAFRIK optimise automatiquement votre image.
        </p>
        <div className="pub-wiz__upload-slot">
          <CoverUploader
            ref={coverRef}
            coverEngine="smart"
            albumId={release.albumId}
            creatorId={uploadCreatorId}
            onFileCleared={onCoverCleared}
            onSuccess={onCoverSuccess}
          />
        </div>
      </div>
    </div>
  );

  if (hidden) {
    return (
      <div className="pub-wiz__step-panel pub-wiz__step-panel--upload-host" hidden aria-hidden="true">
        {body}
      </div>
    );
  }

  return (
    <div className="pub-wiz__step-panel">
      <div className="pub-wiz__step-form">
        {body}
        <div className="pub-wiz__actions">
          <button type="button" className="pub-wiz__btn pub-wiz__btn--ghost" onClick={onGoBack}>
            ← Retour
          </button>
          <button
            type="button"
            className="pub-wiz__btn pub-wiz__btn--primary"
            disabled={!canContinue}
            onClick={() => {
              if (canContinue) onContinue();
            }}
          >
            {uploading2 ? "Envoi en cours…" : "Continuer →"}
          </button>
        </div>
      </div>
    </div>
  );
}
