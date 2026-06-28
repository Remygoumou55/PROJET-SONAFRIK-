import Link from "next/link";
import { memo } from "react";
import { buttonVariants } from "@sonafrik/ui";
import type { GoalViewModel } from "../lib/profileGoals";

interface ProfileGoalsPrimaryCardProps {
  goal: GoalViewModel | null;
}

export const ProfileGoalsPrimaryCard = memo(function ProfileGoalsPrimaryCard({
  goal,
}: ProfileGoalsPrimaryCardProps) {
  if (!goal) {
    return (
      <article
        className="identity-goals-primary identity-goals-primary--complete"
        aria-label="Objectifs complétés"
      >
        <span className="identity-goals-primary__badge" aria-hidden="true">
          🎯
        </span>
        <h3 className="identity-goals-primary__title">Objectifs à jour</h3>
        <p className="identity-goals-primary__description">
          Vous avez atteint vos objectifs actifs. De nouveaux défis apparaîtront
          au fil de votre parcours SONAFRIK.
        </p>
      </article>
    );
  }

  const isComplete = goal.status === "completed";

  return (
    <article
      className={`identity-goals-primary${isComplete ? " identity-goals-primary--done" : ""}`}
      aria-labelledby="goals-primary-title"
    >
      <div className="identity-goals-primary__header">
        <p className="identity-goals-primary__eyebrow">Objectif principal</p>
        <span className="identity-goals-primary__cadence">{goal.cadenceLabel}</span>
      </div>

      <h3 id="goals-primary-title" className="identity-goals-primary__title">
        <span className="identity-goals-primary__icon" aria-hidden="true">
          {goal.icon}
        </span>
        {goal.title}
      </h3>

      <p className="identity-goals-primary__description">{goal.description}</p>

      {!isComplete ? (
        <div
          className="identity-goals-primary__progress"
          role="progressbar"
          aria-valuenow={goal.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progression — ${goal.title}`}
        >
          <div className="identity-goals-primary__progress-track">
            <div
              className="identity-goals-primary__progress-fill"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
          <span className="identity-goals-primary__progress-value">{goal.progress} %</span>
        </div>
      ) : null}

      {goal.nextStepHint ? (
        <p className="identity-goals-primary__hint">{goal.nextStepHint}</p>
      ) : null}

      {goal.benefits.length > 0 ? (
        <ul className="identity-goals-primary__benefits" aria-label="Avantages">
          {goal.benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      ) : null}

      {goal.deadline ? (
        <p className="identity-goals-primary__deadline">
          <span aria-hidden="true">📅</span> Échéance : {goal.deadline}
        </p>
      ) : null}

      {goal.action && !isComplete ? (
        <Link
          href={goal.action.href}
          className={`identity-goals-primary__cta ${buttonVariants({ variant: "primary", size: "md" })}`}
        >
          {goal.action.label}
        </Link>
      ) : null}

      {isComplete && goal.completionMessage ? (
        <p className="identity-goals-primary__complete-msg">{goal.completionMessage}</p>
      ) : null}
    </article>
  );
});
