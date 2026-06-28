import type { Profile } from "@sonafrik/types";
import type { ProfileActivitySummary } from "../lib/profilePresentation";
import { buildProfileJourney } from "../lib/profileJourney";
import { ProfileJourneyNextGoal } from "./ProfileJourneyNextGoal";
import { ProfileJourneyProgressBar } from "./ProfileJourneyProgressBar";
import { ProfileJourneyTimeline } from "./ProfileJourneyTimeline";

interface ProfileJourneySectionProps {
  profile: Profile;
  activity: ProfileActivitySummary;
  isArtist: boolean;
}

export function ProfileJourneySection({
  profile,
  activity,
  isArtist,
}: ProfileJourneySectionProps) {
  const journey = buildProfileJourney(profile, activity, isArtist);

  return (
    <section className="identity-journey" aria-labelledby="profile-journey-title">
      <header className="identity-journey__header">
        <h2 id="profile-journey-title" className="identity-journey__title">
          Mon Parcours SONAFRIK
        </h2>
        <p className="identity-journey__motivation">{journey.motivationMessage}</p>
      </header>

      <ProfileJourneyProgressBar journey={journey} />

      <div className="identity-journey__layout">
        <ProfileJourneyNextGoal journey={journey} />
        <ProfileJourneyTimeline journey={journey} />
      </div>
    </section>
  );
}
