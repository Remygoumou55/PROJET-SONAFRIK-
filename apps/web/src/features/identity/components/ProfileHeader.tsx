import type { IdentityContext } from "@sonafrik/types";
import { BecomeArtistButton } from "./BecomeArtistButton";
import { ProfileSignOutButton } from "./ProfileSignOutButton";
import { ProfileActivitySection } from "./ProfileActivitySection";
import { ProfileHeroPassport } from "./ProfileHeroPassport";
import { ProfileSectionQuickNav } from "./ProfileSectionQuickNav";
import { ProfileGoalsSection } from "./ProfileGoalsSection";
import { ProfileJourneySection } from "./ProfileJourneySection";
import { ProfileMusicalDnaSection } from "./ProfileMusicalDnaSection";
import { ProfileMusicalIdentitySection } from "./ProfileMusicalIdentitySection";
import { ProfileRewardsSection } from "./ProfileRewardsSection";
import { ProfileStorySection } from "./ProfileStorySection";
import { buildMusicalIdentity } from "../lib/profileMusicalIdentity";
import { isArtistAccount, type ProfileActivitySummary } from "../lib/profilePresentation";

interface ProfileHeaderProps {
  context: IdentityContext;
  avatarUrl?: string | null;
  activity: ProfileActivitySummary;
  profileOsEnabled?: boolean;
}

export function ProfileHeader({
  context,
  avatarUrl,
  activity,
  profileOsEnabled = false,
}: ProfileHeaderProps) {
  const isArtist = isArtistAccount(context.profile.account_type);
  const musicalIdentity = buildMusicalIdentity(context.profile, activity, isArtist);

  return (
    <div className="identity-profile">
      <ProfileHeroPassport context={context} avatarUrl={avatarUrl} />

      {profileOsEnabled ? (
        <>
          <ProfileSectionQuickNav />
          <ProfileMusicalIdentitySection identity={musicalIdentity} />
          <ProfileMusicalDnaSection
            profile={context.profile}
            activity={activity}
            isArtist={isArtist}
          />
          <ProfileStorySection
            profile={context.profile}
            activity={activity}
            isArtist={isArtist}
          />
          <ProfileJourneySection
            profile={context.profile}
            activity={activity}
            isArtist={isArtist}
          />
          <ProfileGoalsSection
            profile={context.profile}
            activity={activity}
            isArtist={isArtist}
          />
          <ProfileRewardsSection
            profile={context.profile}
            activity={activity}
            isArtist={isArtist}
          />
        </>
      ) : null}

      <ProfileActivitySection activity={activity} isArtist={isArtist} />

      <ProfileSignOutButton />

      {context.profile.account_type === "auditeur" ? (
        <aside className="identity-become-artist" aria-labelledby="become-artist-title">
          <div className="identity-become-artist__header">
            <span className="identity-become-artist__icon" aria-hidden="true">
              🎤
            </span>
            <h3 id="become-artist-title" className="identity-become-artist__title">
              Passez du côté artiste
            </h3>
          </div>
          <p className="identity-become-artist__text">
            Partagez votre musique avec la communauté SONAFRIK. Publiez vos morceaux,
            suivez vos écoutes et recevez vos revenus en toute transparence.
          </p>
          <BecomeArtistButton />
        </aside>
      ) : null}
    </div>
  );
}
