import { memo } from "react";
import type { JourneyStepViewModel } from "../lib/profileJourney";

const STATUS_LABELS: Record<JourneyStepViewModel["status"], string> = {
  completed: "Étape terminée",
  current: "Étape en cours",
  upcoming: "Étape à venir",
  locked: "Étape verrouillée",
};

interface ProfileJourneyStepItemProps {
  step: JourneyStepViewModel;
  index: number;
  isLast: boolean;
}

export const ProfileJourneyStepItem = memo(function ProfileJourneyStepItem({
  step,
  index,
  isLast,
}: ProfileJourneyStepItemProps) {
  return (
    <li
      className={`identity-journey-step identity-journey-step--${step.status}`}
      aria-current={step.status === "current" ? "step" : undefined}
    >
      {!isLast ? (
        <span className="identity-journey-step__connector" aria-hidden="true" />
      ) : null}

      <div className="identity-journey-step__marker" aria-hidden="true">
        {step.status === "completed" ? (
          <span className="identity-journey-step__check">✓</span>
        ) : step.status === "locked" ? (
          <span className="identity-journey-step__lock">🔒</span>
        ) : (
          <span className="identity-journey-step__icon">{step.icon}</span>
        )}
      </div>

      <div className="identity-journey-step__body">
        <p className="identity-journey-step__title">{step.title}</p>
        <p className="identity-journey-step__status">{STATUS_LABELS[step.status]}</p>
        <span className="identity-journey-step__sr-index">
          Étape {index + 1}
        </span>
      </div>
    </li>
  );
});
