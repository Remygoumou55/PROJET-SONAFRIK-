import { memo } from "react";
import type { GoalViewModel } from "../lib/profileGoals";

interface ProfileGoalsSecondaryListProps {
  goals: GoalViewModel[];
}

export const ProfileGoalsSecondaryList = memo(function ProfileGoalsSecondaryList({
  goals,
}: ProfileGoalsSecondaryListProps) {
  if (goals.length === 0) return null;

  return (
    <div className="identity-goals-secondary" aria-labelledby="goals-secondary-title">
      <h3 id="goals-secondary-title" className="identity-goals-secondary__title">
        Objectifs secondaires
      </h3>
      <ul className="identity-goals-secondary__list">
        {goals.map((goal) => (
          <li key={goal.id}>
            <article
              className={`identity-goals-secondary__card identity-goals-secondary__card--${goal.status}`}
              aria-label={goal.ariaLabel}
            >
              <div className="identity-goals-secondary__top">
                <span className="identity-goals-secondary__icon" aria-hidden="true">
                  {goal.icon}
                </span>
                <div className="identity-goals-secondary__meta">
                  <p className="identity-goals-secondary__name">{goal.shortTitle}</p>
                  <p className="identity-goals-secondary__category">{goal.categoryLabel}</p>
                </div>
                <span className="identity-goals-secondary__percent">{goal.progress} %</span>
              </div>
              <div
                className="identity-goals-secondary__track"
                role="progressbar"
                aria-valuenow={goal.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progression — ${goal.shortTitle}`}
              >
                <div
                  className="identity-goals-secondary__fill"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
});
