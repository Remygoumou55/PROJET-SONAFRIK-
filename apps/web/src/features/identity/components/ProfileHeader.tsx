import type { IdentityContext } from "@sonafrik/types";
import { BecomeArtistButton } from "./BecomeArtistButton";
import { ProfileActivitySection } from "./ProfileActivitySection";
import { ProfileHeroPassport } from "./ProfileHeroPassport";
import { isArtistAccount, type ProfileActivitySummary } from "../lib/profilePresentation";

interface ProfileHeaderProps {
  context: IdentityContext;
  avatarUrl?: string | null;
  activity: ProfileActivitySummary;
}

export function ProfileHeader({ context, avatarUrl, activity }: ProfileHeaderProps) {
  const isArtist = isArtistAccount(context.profile.account_type);

  return (
    <div className="identity-profile">
      <ProfileHeroPassport context={context} avatarUrl={avatarUrl} />

      <ProfileActivitySection activity={activity} isArtist={isArtist} />

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
