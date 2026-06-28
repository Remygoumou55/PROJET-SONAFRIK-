import type { JourneyProgressViewModel } from "../lib/profileJourney";

interface ProfileJourneyProgressBarProps {
  journey: JourneyProgressViewModel;
}

export function ProfileJourneyProgressBar({ journey }: ProfileJourneyProgressBarProps) {
  const currentLabel = journey.currentStep?.shortLabel ?? "Parcours terminé";
  const nextLabel = journey.nextStep?.shortLabel ?? "Toutes les étapes sont complétées";

  return (
    <div className="identity-journey-progress" aria-labelledby="journey-progress-title">
      <div className="identity-journey-progress__header">
        <div className="identity-journey-progress__percent-wrap">
          <span className="identity-journey-progress__percent" aria-hidden="true">
            {journey.percent}%
          </span>
          <p id="journey-progress-title" className="identity-journey-progress__label">
            Progression globale
          </p>
        </div>
        <div className="identity-journey-progress__counts">
          <span className="identity-journey-progress__count identity-journey-progress__count--done">
            <strong>{journey.completedCount}</strong> terminée{journey.completedCount > 1 ? "s" : ""}
          </span>
          <span className="identity-journey-progress__count identity-journey-progress__count--left">
            <strong>{journey.remainingCount}</strong> restante{journey.remainingCount > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div
        className="identity-journey-progress__track"
        role="progressbar"
        aria-valuenow={journey.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Parcours complété à ${journey.percent} pour cent`}
      >
        <div
          className="identity-journey-progress__fill"
          style={{ width: `${journey.percent}%` }}
        />
        <div
          className="identity-journey-progress__glow"
          style={{ width: `${journey.percent}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="identity-journey-progress__steps-meta">
        <p className="identity-journey-progress__step identity-journey-progress__step--current">
          <span className="identity-journey-progress__step-label">Étape actuelle</span>
          <span className="identity-journey-progress__step-value">{currentLabel}</span>
        </p>
        <p className="identity-journey-progress__step identity-journey-progress__step--next">
          <span className="identity-journey-progress__step-label">Prochaine étape</span>
          <span className="identity-journey-progress__step-value">{nextLabel}</span>
        </p>
      </div>
    </div>
  );
}
