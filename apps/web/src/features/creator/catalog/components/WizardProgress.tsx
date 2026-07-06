"use client";

import {
  type WizardStep,
  WIZARD_STEP_LABELS,
  isStepClickable,
  resolveStepStatus,
} from "@sonafrik/shared/publication-wizard";

export function WizardProgress({
  step,
  maxValidatedStep,
  onStepSelect,
}: {
  step: WizardStep;
  maxValidatedStep: WizardStep;
  onStepSelect: (target: WizardStep) => void;
}) {
  return (
    <nav className="pub-wiz__progress" aria-label="Étapes de publication">
      {WIZARD_STEP_LABELS.map((label, i) => {
        const n = (i + 1) as WizardStep;
        const status = resolveStepStatus(n, step, maxValidatedStep);
        const clickable = isStepClickable(n, step, maxValidatedStep);
        return (
          <div key={n} className={`pub-wiz__step pub-wiz__step--${status}`}>
            <button
              type="button"
              className="pub-wiz__step-btn"
              disabled={!clickable}
              aria-current={status === "active" ? "step" : undefined}
              aria-label={
                status === "active"
                  ? `Étape ${n} — ${label} (actuelle)`
                  : clickable
                    ? `Revenir à l'étape ${n} — ${label}`
                    : `Étape ${n} — ${label} (verrouillée)`
              }
              onClick={() => onStepSelect(n)}
            >
              <span className="pub-wiz__step-dot" aria-hidden="true">
                {status === "done" && n !== step ? "✓" : n}
              </span>
              <span className="pub-wiz__step-label">{label}</span>
            </button>
            {i < WIZARD_STEP_LABELS.length - 1 && (
              <div
                className={`pub-wiz__step-line${status === "done" ? " pub-wiz__step-line--done" : ""}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
