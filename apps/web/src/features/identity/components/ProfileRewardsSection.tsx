import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../lib/profilePresentation";
import { buildRewardEngine } from "../lib/profileRewards";
import { ProfileRewardsGrid } from "./ProfileRewardsGrid";
import { ProfileRewardsSummary } from "./ProfileRewardsSummary";

interface ProfileRewardsSectionProps {
  profile: Profile;
  activity: ProfileActivitySummary;
  isArtist: boolean;
}

export function ProfileRewardsSection({
  profile,
  activity,
  isArtist,
}: ProfileRewardsSectionProps) {
  const engine = buildRewardEngine(profile, activity, isArtist);

  const upcomingAndProgress = [...engine.inProgress, ...engine.upcoming];

  return (
    <section className="identity-rewards" aria-labelledby="profile-rewards-title">
      <header className="identity-rewards__header">
        <h2 id="profile-rewards-title" className="identity-rewards__title">
          Mes Récompenses SONAFRIK
        </h2>
        <p className="identity-rewards__motivation">{engine.motivationMessage}</p>
      </header>

      <ProfileRewardsSummary engine={engine} />

      <div className="identity-rewards__panels">
        <ProfileRewardsGrid
          listId="rewards-unlocked-title"
          title="Récompenses obtenues"
          rewards={engine.unlocked}
          emptyMessage="Vos premières récompenses apparaîtront ici — continuez votre parcours."
        />
        <ProfileRewardsGrid
          listId="rewards-upcoming-title"
          title="Récompenses à venir"
          rewards={upcomingAndProgress}
          emptyMessage="Bravo — vous avez débloqué toutes les récompenses disponibles."
        />
      </div>
    </section>
  );
}
