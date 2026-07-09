"use client";

import type { Genre } from "@sonafrik/types";
import { WIZARD_LANG_OPTIONS } from "../lib/publicationWizardConstants";
import type { WizardMetadataForm } from "../lib/publicationWizardTypes";

function MetaFieldIcon({ type }: { type: "genre" | "language" }) {
  if (type === "genre") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M6 2.5v11M10 2.5v11M3 5.5h10M3 10.5h10"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M2.5 8h11M8 2.5c1.5 1.67 2.25 3.67 2.25 5.5S9.5 11.83 8 13.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface WizardStep3PanelProps {
  meta: WizardMetadataForm;
  genres: Genre[];
  genresError: boolean;
  savingMeta: boolean;
  onMetaChange: (patch: Partial<WizardMetadataForm>) => void;
  onRetryGenres: () => void;
  onGoBack: () => void;
  onContinue: () => void;
}

export function WizardStep3Panel({
  meta,
  genres,
  genresError,
  savingMeta,
  onMetaChange,
  onRetryGenres,
  onGoBack,
  onContinue,
}: WizardStep3PanelProps) {
  const canContinue = !savingMeta && Boolean(meta.genreId) && Boolean(meta.language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canContinue) onContinue();
  };

  return (
    <form className="pub-wiz__step-form pub-wiz__body pub-wiz__body--step3" onSubmit={handleSubmit}>
      <div className="pub-wiz__card pub-wiz__card--compact pub-wiz__card--meta">
        <header className="pub-wiz__meta-header">
          <div className="pub-wiz__meta-header-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 12.5V5.5a1 1 0 0 1 1.55-.83L9 7.2l4.45-2.53A1 1 0 0 1 15 5.5v7"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 14.5h8"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="pub-wiz__meta-header-copy">
            <h2 className="pub-wiz__card-title pub-wiz__meta-title">Informations du morceau</h2>
            <p className="pub-wiz__card-sub pub-wiz__meta-sub">
              Genre et langue suffisent — SONAFRIK complète le reste pour vous.
            </p>
          </div>
          <span className="pub-wiz__meta-pill">Auto</span>
        </header>

        <div className="pub-wiz__form-grid pub-wiz__form-grid--step3">
          <div
            className={`pub-wiz__meta-field${meta.genreId ? " pub-wiz__meta-field--filled" : ""}`}
          >
            <label className="pub-wiz__meta-label">
              <span className="pub-wiz__meta-field-head">
                <span className="pub-wiz__meta-field-icon">
                  <MetaFieldIcon type="genre" />
                </span>
                <span className="pub-wiz__meta-field-name">Genre</span>
                <span className="pub-wiz__meta-required">Requis</span>
              </span>
              <div className="pub-wiz__select-wrap">
                <select
                  className="pub-wiz__select pub-wiz__select--meta"
                  value={meta.genreId}
                  required
                  aria-required="true"
                  aria-label="Genre musical"
                  onChange={(e) => onMetaChange({ genreId: e.target.value })}
                >
                  <option value="">Choisir un genre</option>
                  {genres.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </label>
            {genresError && (
              <p className="pub-wiz__field-error" role="alert">
                Impossible de charger les genres.{" "}
                <button type="button" className="pub-wiz__link-btn" onClick={onRetryGenres}>
                  Réessayer
                </button>
              </p>
            )}
          </div>

          <div
            className={`pub-wiz__meta-field${meta.language ? " pub-wiz__meta-field--filled" : ""}`}
          >
            <label className="pub-wiz__meta-label">
              <span className="pub-wiz__meta-field-head">
                <span className="pub-wiz__meta-field-icon">
                  <MetaFieldIcon type="language" />
                </span>
                <span className="pub-wiz__meta-field-name">Langue</span>
                <span className="pub-wiz__meta-required">Requis</span>
              </span>
              <div className="pub-wiz__select-wrap">
                <select
                  className="pub-wiz__select pub-wiz__select--meta"
                  value={meta.language}
                  required
                  aria-required="true"
                  aria-label="Langue du morceau"
                  onChange={(e) => onMetaChange({ language: e.target.value })}
                >
                  {WIZARD_LANG_OPTIONS.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </label>
          </div>
        </div>

        <details className="pub-wiz__advanced pub-wiz__advanced--meta">
          <summary className="pub-wiz__advanced-summary pub-wiz__advanced-summary--meta">
            <span className="pub-wiz__advanced-chevron" aria-hidden="true" />
            <span className="pub-wiz__advanced-summary-text">
              Options avancées
              <span className="pub-wiz__advanced-hint">Paroles · Contenu explicite</span>
            </span>
          </summary>
          <div className="pub-wiz__advanced-body pub-wiz__advanced-body--meta">
            <label className="pub-wiz__label pub-wiz__label--meta">
              <span className="pub-wiz__label-row">
                Ajouter les paroles
                <span className="pub-wiz__optional">Facultatif</span>
              </span>
              <textarea
                className="pub-wiz__textarea pub-wiz__textarea--meta"
                value={meta.lyrics}
                rows={4}
                placeholder="Collez ou saisissez les paroles de votre morceau…"
                onChange={(e) => onMetaChange({ lyrics: e.target.value })}
              />
            </label>

            <div className="pub-wiz__explicit-row pub-wiz__explicit-row--meta">
              <label className="pub-wiz__toggle-row pub-wiz__toggle-row--block pub-wiz__toggle-row--meta">
                <input
                  type="checkbox"
                  className="pub-wiz__toggle"
                  checked={meta.explicit}
                  onChange={(e) => onMetaChange({ explicit: e.target.checked })}
                />
                <span className="pub-wiz__toggle-label">
                  Contenu explicite
                  <span className="pub-wiz__optional">Facultatif</span>
                </span>
              </label>
              <p className="pub-wiz__explicit-help">
                Cochez uniquement si votre musique contient des propos sensibles nécessitant un
                avertissement.
              </p>
            </div>
          </div>
        </details>
      </div>

      <div className="pub-wiz__actions pub-wiz__actions--step3">
        <button type="button" className="pub-wiz__btn pub-wiz__btn--ghost" onClick={onGoBack}>
          ← Retour
        </button>
        <button
          type="submit"
          className="pub-wiz__btn pub-wiz__btn--primary"
          disabled={!canContinue}
        >
          {savingMeta ? "Sauvegarde…" : "Continuer →"}
        </button>
      </div>
    </form>
  );
}
