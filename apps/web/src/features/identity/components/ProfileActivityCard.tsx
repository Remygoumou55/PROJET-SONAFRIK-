import { memo } from "react";
import type { ActivityCardViewModel } from "../lib/profileActivityStories";
import { getJourneyStateLabel } from "../lib/profileActivityStories";

interface ProfileActivityCardProps {
  card: ActivityCardViewModel;
}

export const ProfileActivityCard = memo(function ProfileActivityCard({
  card,
}: ProfileActivityCardProps) {
  const stateLabel = getJourneyStateLabel(card.journeyState);

  return (
    <article
      className="identity-activity-card"
      aria-label={card.ariaLabel}
      data-journey-state={card.journeyState}
    >
      <span className="identity-activity-card__icon" aria-hidden="true">
        {card.icon}
      </span>
      <p className="identity-activity-card__title">{card.title}</p>
      <p className="identity-activity-card__headline">{card.headline}</p>
      <p className="identity-activity-card__message">{card.message}</p>
      <div
        className="identity-activity-card__progress"
        role="progressbar"
        aria-valuenow={card.progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progression — ${stateLabel}`}
      >
        <div
          className="identity-activity-card__progress-fill"
          style={{ width: `${card.progress}%` }}
        />
      </div>
      <span className="identity-activity-card__state">{stateLabel}</span>
    </article>
  );
});
