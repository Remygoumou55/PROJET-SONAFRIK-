"use client";

import { FIELD_LIMITS } from "@sonafrik/shared/field-limits";

interface WizardStep1PanelProps {
  titleInput: string;
  creating: boolean;
  onTitleChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoBack: () => void;
}

export function WizardStep1Panel({
  titleInput,
  creating,
  onTitleChange,
  onSubmit,
  onGoBack,
}: WizardStep1PanelProps) {
  return (
    <div className="pub-wiz__body pub-wiz__body--centered">
      <div className="pub-wiz__card pub-wiz__card--wide">
        <h2 className="pub-wiz__card-title">Titre du morceau</h2>
        <p className="pub-wiz__card-sub">Choisissez un titre clair et mémorable pour votre morceau.</p>
        <form onSubmit={onSubmit} className="pub-wiz__form">
          <div className="pub-wiz__field">
            <input
              className="pub-wiz__input"
              type="text"
              placeholder="Ex : Mon Beau Pays"
              value={titleInput}
              maxLength={FIELD_LIMITS.TRACK_TITLE}
              onChange={(e) => onTitleChange(e.target.value)}
              autoFocus
              aria-label="Titre du morceau"
            />
            <span className="pub-wiz__counter">
              {titleInput.length}/{FIELD_LIMITS.TRACK_TITLE}
            </span>
          </div>
          <div className="pub-wiz__actions">
            <button type="button" className="pub-wiz__btn pub-wiz__btn--ghost" onClick={onGoBack}>
              ← Retour
            </button>
            <button
              type="submit"
              className="pub-wiz__btn pub-wiz__btn--primary"
              disabled={creating || titleInput.trim().length < 2}
            >
              {creating ? "Création…" : "Continuer →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
