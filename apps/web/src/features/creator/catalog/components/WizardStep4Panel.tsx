"use client";

import type { CreatedRelease } from "../lib/publicationWizardTypes";

interface WizardStep4PanelProps {
  release: CreatedRelease;
  stageName: string;
  genreLabel: string;
  languageLabel: string;
  coverPreviewUrl: string | null;
  publishing: boolean;
  onBackToMeta: () => void;
  onPublish: () => void;
}

export function WizardStep4Panel({
  release,
  stageName,
  genreLabel,
  languageLabel,
  coverPreviewUrl,
  publishing,
  onBackToMeta,
  onPublish,
}: WizardStep4PanelProps) {
  return (
    <div className="pub-wiz__body pub-wiz__body--confirm">
      <article className="pub-wiz__confirm-card" aria-labelledby="pub-wiz-confirm-title">
        <header className="pub-wiz__confirm-hero">
          <p className="pub-wiz__confirm-ready">
            <span className="pub-wiz__confirm-ready-icon" aria-hidden="true">✓</span>
            Votre musique est prête à être publiée.
          </p>
          <p className="pub-wiz__confirm-reassurance">
            Tout est prêt. Après publication, votre morceau sera envoyé en validation avant sa mise en ligne.
          </p>
        </header>

        <div className="pub-wiz__confirm-summary">
          <div className="pub-wiz__confirm-cover-wrap">
            {coverPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreviewUrl}
                alt={`Pochette de ${release.title}`}
                className="pub-wiz__confirm-cover-side pub-wiz__confirm-cover-side--img"
              />
            ) : (
              <div className="pub-wiz__confirm-cover-side pub-wiz__confirm-cover-side--placeholder" aria-hidden="true">
                🎵
              </div>
            )}
          </div>

          <div className="pub-wiz__confirm-meta">
            <h2 id="pub-wiz-confirm-title" className="pub-wiz__confirm-track-title">
              {release.title}
            </h2>
            <p className="pub-wiz__confirm-artist-name">{stageName}</p>
            <dl className="pub-wiz__confirm-meta-list">
              <div className="pub-wiz__confirm-meta-row">
                <dt className="pub-wiz__confirm-meta-label">Genre</dt>
                <dd>{genreLabel}</dd>
              </div>
              <div className="pub-wiz__confirm-meta-row">
                <dt className="pub-wiz__confirm-meta-label">Langue</dt>
                <dd>{languageLabel}</dd>
              </div>
            </dl>
          </div>
        </div>

        <ul className="pub-wiz__confirm-status" aria-label="État des fichiers">
          <li className="pub-wiz__confirm-status-item">
            <span className="pub-wiz__confirm-status-icon" aria-hidden="true">✓</span>
            Audio prêt
          </li>
          <li className="pub-wiz__confirm-status-item">
            <span className="pub-wiz__confirm-status-icon" aria-hidden="true">{coverPreviewUrl ? "✓" : "🎨"}</span>
            {coverPreviewUrl ? "Pochette prête" : "Pochette automatique SONAFRIK"}
          </li>
        </ul>

        <p className="pub-wiz__confirm-tip">
          Vous pourrez modifier les informations de votre morceau tant qu&apos;il n&apos;aura pas été validé.
        </p>

        <div className="pub-wiz__confirm-actions">
          <button
            type="button"
            className="pub-wiz__btn pub-wiz__btn--ghost"
            disabled={publishing}
            onClick={onBackToMeta}
          >
            ← Retour aux informations
          </button>
          <button
            type="button"
            className="pub-wiz__btn pub-wiz__btn--primary pub-wiz__btn--publish"
            disabled={publishing}
            onClick={onPublish}
          >
            {publishing ? "Publication en cours…" : "Publier maintenant"}
          </button>
        </div>
      </article>
    </div>
  );
}
