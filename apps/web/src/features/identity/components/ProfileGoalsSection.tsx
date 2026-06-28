import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../lib/profilePresentation";
import { buildSmartGoalsEngine } from "../lib/profileGoals";
import { ProfileGoalsPrimaryCard } from "./ProfileGoalsPrimaryCard";
import { ProfileGoalsProgressSummary } from "./ProfileGoalsProgressSummary";
import { ProfileGoalsSecondaryList } from "./ProfileGoalsSecondaryList";

interface ProfileGoalsSectionProps {
  profile: Profile;
  activity: ProfileActivitySummary;
  isArtist: boolean;
}

export function ProfileGoalsSection({
  profile,
  activity,
  isArtist,
}: ProfileGoalsSectionProps) {
  const engine = buildSmartGoalsEngine(profile, activity, isArtist);

  return (
    <section className="identity-goals" aria-labelledby="profile-goals-title">
      <header className="identity-goals__header">
        <h2 id="profile-goals-title" className="identity-goals__title">
          Mes objectifs
        </h2>
        <p className="identity-goals__motivation">{engine.motivationMessage}</p>
      </header>

      <ProfileGoalsProgressSummary engine={engine} />

      <div className="identity-goals__layout">
        <ProfileGoalsPrimaryCard goal={engine.primaryGoal} />
        <ProfileGoalsSecondaryList goals={engine.secondaryGoals} />
      </div>
    </section>
  );
}
