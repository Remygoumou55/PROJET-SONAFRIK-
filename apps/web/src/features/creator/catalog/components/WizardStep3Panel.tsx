"use client";

import type { Genre } from "@sonafrik/types";
import { WIZARD_LANG_OPTIONS } from "../lib/publicationWizardConstants";
import type { WizardMetadataForm } from "../lib/publicationWizardTypes";

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
  return (
    <div className="pub-wiz__body pub-wiz__body--step3">
      <div className="pub-wiz__card pub-wiz__card--compact">
        <h2 className="pub-wiz__card-title">Informations du morceau</h2>
        <p className="pub-wiz__card-sub">
          Seuls le genre et la langue sont requis. Le reste est généré automatiquement par SONAFRIK.
        </p>

        <div className="pub-wiz__form-grid pub-wiz__form-grid--step3">
          <label className="pub-wiz__label">
            Genre <span className="pub-wiz__required" aria-hidden="true">*</span>
            <select
              className="pub-wiz__select"
              value={meta.genreId}
              required
              aria-required="true"
              onChange={(e) => onMetaChange({ genreId: e.target.value })}
            >
              <option value="">Sélectionner un genre</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            {genresError && (
              <p className="pub-wiz__field-error" role="alert">
                Impossible de charger les genres.{" "}
                <button type="button" className="pub-wiz__link-btn" onClick={onRetryGenres}>
                  Réessayer
                </button>
              </p>
            )}
          </label>

          <label className="pub-wiz__label">
            Langue <span className="pub-wiz__required" aria-hidden="true">*</span>
            <select
              className="pub-wiz__select"
              value={meta.language}
              required
              aria-required="true"
              onChange={(e) => onMetaChange({ language: e.target.value })}
            >
              {WIZARD_LANG_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </label>
        </div>

        <details className="pub-wiz__advanced">
          <summary className="pub-wiz__advanced-summary">
            Options avancées
            <span className="pub-wiz__advanced-hint">Paroles · Contenu explicite</span>
          </summary>
          <div className="pub-wiz__advanced-body">
            <label className="pub-wiz__label">
              Ajouter les paroles
              <span className="pub-wiz__optional">Facultatif</span>
              <textarea
                className="pub-wiz__textarea"
                value={meta.lyrics}
                rows={4}
                placeholder="Collez ou saisissez les paroles de votre morceau…"
                onChange={(e) => onMetaChange({ lyrics: e.target.value })}
              />
            </label>

            <div className="pub-wiz__explicit-row">
              <label className="pub-wiz__toggle-row pub-wiz__toggle-row--block">
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
                Cochez cette case uniquement si votre musique contient des insultes, des propos sexuels,
                des contenus violents ou d&apos;autres contenus nécessitant un avertissement.
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
          type="button"
          className="pub-wiz__btn pub-wiz__btn--primary"
          disabled={savingMeta || !meta.genreId || !meta.language}
          onClick={onContinue}
        >
          {savingMeta ? "Sauvegarde…" : "Continuer →"}
        </button>
      </div>
    </div>
  );
}
