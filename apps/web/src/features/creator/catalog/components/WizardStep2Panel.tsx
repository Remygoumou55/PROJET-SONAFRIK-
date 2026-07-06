"use client";

import type { RefObject } from "react";
import { AudioUploader } from "./AudioUploader";
import { CoverUploader } from "./CoverUploader";
import type { AudioUploaderHandle } from "./AudioUploader";
import type { CoverUploaderHandle } from "./CoverUploader";

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
  return (
    <div className="pub-wiz__step-panel" hidden={hidden}>
      <div className="pub-wiz__body pub-wiz__body--step2">
        <div className="pub-wiz__card pub-wiz__card--compact">
          <h3 className="pub-wiz__card-title">Fichier audio</h3>
          <p className="pub-wiz__card-sub">Choisissez le morceau à publier.</p>
          <AudioUploader
            ref={audioRef}
            trackId={release.trackId}
            creatorId={uploadCreatorId}
            onFileReady={onAudioReady}
            onFileCleared={onAudioCleared}
          />
        </div>

        <div className="pub-wiz__card pub-wiz__card--compact">
          <h3 className="pub-wiz__card-title">Pochette</h3>
          <p className="pub-wiz__card-sub">
            Optionnel — SONAFRIK optimise automatiquement votre image.
          </p>
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

      <div className="pub-wiz__actions">
        <button type="button" className="pub-wiz__btn pub-wiz__btn--ghost" onClick={onGoBack}>
          ← Retour
        </button>
        <button
          type="button"
          className="pub-wiz__btn pub-wiz__btn--primary"
          disabled={uploading2 || !audioReady}
          onClick={onContinue}
        >
          {uploading2 ? "Envoi en cours…" : "Continuer →"}
        </button>
      </div>
    </div>
  );
}
