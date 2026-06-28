import type { ProfileActivitySummary } from "../lib/profilePresentation";
import { buildActivityCards } from "../lib/profileActivityStories";
import { ProfileActivityCard } from "./ProfileActivityCard";

interface ProfileActivitySectionProps {
  activity: ProfileActivitySummary;
  isArtist: boolean;
}

export function ProfileActivitySection({ activity, isArtist }: ProfileActivitySectionProps) {
  const cards = buildActivityCards(activity, isArtist);

  return (
    <section id="profile-activity" className="identity-activity" aria-labelledby="profile-activity-title">
      <div className="identity-activity__header">
        <h2 id="profile-activity-title" className="identity-activity__title">
          Mon activité
        </h2>
        <p className="identity-activity__subtitle">
          Chaque statistique raconte un chapitre de votre histoire sur SONAFRIK.
        </p>
      </div>

      <div className="identity-activity__grid" role="list">
        {cards.map((card) => (
          <div key={card.id} role="listitem" className="identity-activity__grid-cell">
            <ProfileActivityCard card={card} />
          </div>
        ))}
      </div>
    </section>
  );
}
