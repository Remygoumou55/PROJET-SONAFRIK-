"use client";

import { useEffect, useState } from "react";
import type { Genre } from "@sonafrik/types";
import { WIZARD_LANG_OPTIONS } from "../lib/publicationWizardConstants";
import type { CreatedRelease, WizardMetadataForm } from "../lib/publicationWizardTypes";
import { runWizardTask } from "../lib/wizardErrorMessage";

export interface ReviewAudioInfo {
  fileName: string;
  durationSeconds: number;
  format: string;
  sizeLabel: string;
}

interface WizardStep4PanelProps {
  release: CreatedRelease;
  stageName: string;
  meta: WizardMetadataForm;
  genres: Genre[];
  coverPreviewUrl: string | null;
  audioInfo: ReviewAudioInfo | null;
  audioInfoLoading: boolean;
  savingReview: boolean;
  replacingMedia: boolean;
  publishing: boolean;
  onTitleSave: (title: string) => Promise<void>;
  onMetaChange: (patch: Partial<WizardMetadataForm>) => void;
  onMetaSave: (patch?: Partial<WizardMetadataForm>) => Promise<void>;
  onReplaceCover: () => void;
  onReplaceAudio: () => void;
  onPublish: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WizardStep4Panel({
  release,
  stageName,
  meta,
  genres,
  coverPreviewUrl,
  audioInfo,
  audioInfoLoading,
  savingReview,
  replacingMedia,
  publishing,
  onTitleSave,
  onMetaChange,
  onMetaSave,
  onReplaceCover,
  onReplaceAudio,
  onPublish,
}: WizardStep4PanelProps) {
  const busy = publishing || savingReview || replacingMedia;
  const [titleDraft, setTitleDraft] = useState(release.title);

  useEffect(() => {
    setTitleDraft(release.title);
  }, [release.title]);

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed.length < 2 || trimmed === release.title) return;
    void onTitleSave(trimmed);
  };

  return (
    <div className="pub-wiz__body pub-wiz__body--confirm pub-wiz__body--review">
      <article className="pub-wiz__confirm-card pub-wiz__review-card" aria-labelledby="pub-wiz-review-title">
        <header className="pub-wiz__review-hero">
          <p className="pub-wiz__review-eyebrow">Contrôle qualité final</p>
          <h2 id="pub-wiz-review-title" className="pub-wiz__review-title">
            Révision avant publication
          </h2>
          <p className="pub-wiz__review-sub">
            Vérifiez et corrigez chaque détail ici — aucun retour aux étapes précédentes n&apos;est nécessaire.
          </p>
        </header>

        <section className="pub-wiz__review-section pub-wiz__review-section--cover">
          <div className="pub-wiz__review-cover-wrap">
            {coverPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreviewUrl}
                alt={`Pochette de ${release.title}`}
                className="pub-wiz__review-cover-img"
              />
            ) : (
              <div className="pub-wiz__review-cover-placeholder" aria-hidden="true">
                ♪
              </div>
            )}
            <button
              type="button"
              className="pub-wiz__review-edit-overlay"
              disabled={busy}
              onClick={onReplaceCover}
            >
              Changer la pochette
            </button>
          </div>
        </section>

        <section className="pub-wiz__review-section">
          <div className="pub-wiz__review-row">
            <label className="pub-wiz__review-label" htmlFor="pub-review-title">
              Titre
            </label>
            <div className="pub-wiz__review-inline">
              <input
                id="pub-review-title"
                className="pub-wiz__review-input"
                value={titleDraft}
                disabled={busy}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitTitle();
                  }
                }}
              />
            </div>
          </div>
          <p className="pub-wiz__review-artist">{stageName}</p>
        </section>

        <section className="pub-wiz__review-section">
          <div className="pub-wiz__review-row pub-wiz__review-row--stack">
            <span className="pub-wiz__review-label">Fichier audio</span>
            {audioInfoLoading ? (
              <p className="pub-wiz__review-muted">Chargement…</p>
            ) : audioInfo ? (
              <ul className="pub-wiz__review-audio-meta">
                <li>{audioInfo.fileName}</li>
                <li>{formatDuration(audioInfo.durationSeconds)} · {audioInfo.sizeLabel} · {audioInfo.format.toUpperCase()}</li>
              </ul>
            ) : (
              <p className="pub-wiz__review-muted">Audio enregistré</p>
            )}
            <button
              type="button"
              className="pub-wiz__review-link-btn"
              disabled={busy}
              onClick={onReplaceAudio}
            >
              Remplacer le fichier
            </button>
          </div>
        </section>

        <section className="pub-wiz__review-grid">
          <div className="pub-wiz__review-field">
            <label className="pub-wiz__review-label" htmlFor="pub-review-genre">
              Genre
            </label>
            <select
              id="pub-review-genre"
              className="pub-wiz__review-select"
              value={meta.genreId}
              disabled={busy}
              onChange={(e) => {
                const genreId = e.target.value;
                onMetaChange({ genreId });
                runWizardTask(() => onMetaSave({ genreId }));
              }}
            >
              <option value="">Choisir</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="pub-wiz__review-field">
            <label className="pub-wiz__review-label" htmlFor="pub-review-lang">
              Langue
            </label>
            <select
              id="pub-review-lang"
              className="pub-wiz__review-select"
              value={meta.language}
              disabled={busy}
              onChange={(e) => {
                const language = e.target.value;
                onMetaChange({ language });
                runWizardTask(() => onMetaSave({ language }));
              }}
            >
              {WIZARD_LANG_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="pub-wiz__review-section">
          <label className="pub-wiz__review-label" htmlFor="pub-review-lyrics">
            Paroles / description
          </label>
          <textarea
            id="pub-review-lyrics"
            className="pub-wiz__review-textarea"
            rows={4}
            value={meta.lyrics}
            disabled={busy}
            placeholder="Paroles ou description (optionnel)"
            onChange={(e) => onMetaChange({ lyrics: e.target.value })}
            onBlur={() => {
              runWizardTask(() => onMetaSave());
            }}
          />
          <label className="pub-wiz__review-check">
            <input
              type="checkbox"
              checked={meta.explicit}
              disabled={busy}
              onChange={(e) => {
                const explicit = e.target.checked;
                onMetaChange({ explicit });
                runWizardTask(() => onMetaSave({ explicit }));
              }}
            />
            Contenu explicite
          </label>
        </section>

        <p className="pub-wiz__review-tip">
          Après publication, votre morceau passera en statut <strong>En revue</strong> avant sa mise en ligne.
        </p>

        <div className="pub-wiz__confirm-actions pub-wiz__review-actions">
          <button
            type="button"
            className="pub-wiz__btn pub-wiz__btn--primary pub-wiz__btn--publish"
            disabled={busy || !meta.genreId}
            onClick={onPublish}
          >
            {publishing ? (
              <>
                <span className="pub-wiz__spinner" aria-hidden="true" />
                Publication en cours…
              </>
            ) : (
              "Publier"
            )}
          </button>
        </div>
      </article>
    </div>
  );
}
