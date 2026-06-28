import Link from "next/link";
import { buttonVariants } from "@sonafrik/ui";
import type { JourneyProgressViewModel } from "../lib/profileJourney";

interface ProfileJourneyNextGoalProps {
  journey: JourneyProgressViewModel;
}

export function ProfileJourneyNextGoal({ journey }: ProfileJourneyNextGoalProps) {
  const goal = journey.currentStep ?? journey.nextStep;

  if (!goal) {
    return (
      <article className="identity-journey-goal identity-journey-goal--complete" aria-label="Parcours terminé">
        <span className="identity-journey-goal__badge" aria-hidden="true">
          🏆
        </span>
        <h3 className="identity-journey-goal__title">Parcours complet</h3>
        <p className="identity-journey-goal__why">
          Vous avez accompli toutes les étapes de votre parcours SONAFRIK. Continuez à
          faire vibrer la musique guinéenne.
        </p>
      </article>
    );
  }

  return (
    <article
      className="identity-journey-goal"
      aria-labelledby="journey-next-goal-title"
    >
      <p className="identity-journey-goal__eyebrow">Votre prochain objectif</p>
      <h3 id="journey-next-goal-title" className="identity-journey-goal__title">
        <span className="identity-journey-goal__icon" aria-hidden="true">
          {goal.icon}
        </span>
        {goal.title}
      </h3>

      {goal.whyImportant ? (
        <div className="identity-journey-goal__block">
          <p className="identity-journey-goal__block-label">Pourquoi ?</p>
          <p className="identity-journey-goal__why">{goal.whyImportant}</p>
        </div>
      ) : null}

      {goal.benefits && goal.benefits.length > 0 ? (
        <ul className="identity-journey-goal__benefits" aria-label="Avantages">
          {goal.benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      ) : null}

      {goal.action ? (
        <Link
          href={goal.action.href}
          className={`identity-journey-goal__cta ${buttonVariants({ variant: "primary", size: "md" })}`}
        >
          {goal.action.label}
        </Link>
      ) : null}
    </article>
  );
}
