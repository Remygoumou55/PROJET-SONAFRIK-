import Link from "next/link";
import { Avatar, Badge, buttonVariants } from "@sonafrik/ui";
import type { IdentityContext } from "@sonafrik/types";
import { formatDate } from "@/lib/formatters";
import { BecomeArtistButton } from "./BecomeArtistButton";
import { ProfileActivitySection } from "./ProfileActivitySection";
import {
  computeProfileCompletion,
  getAccountTypeLabel,
  getDisplayName,
  getSongLanguageLabel,
  humanizeVisibility,
  isArtistAccount,
  type ProfileActivitySummary,
} from "../lib/profilePresentation";

interface ProfileHeaderProps {
  context: IdentityContext;
  avatarUrl?: string | null;
  activity: ProfileActivitySummary;
}

export function ProfileHeader({ context, avatarUrl, activity }: ProfileHeaderProps) {
  const { profile, preferences } = context;
  const displayName = getDisplayName(profile);
  const isArtist = isArtistAccount(profile.account_type);
  const accountLabel = getAccountTypeLabel(profile.account_type);
  const completion = computeProfileCompletion(profile);
  const genreLabel = profile.main_genre?.trim() || null;
  const languageLabel = getSongLanguageLabel(profile.song_language);
  const location = [profile.city, profile.origin_region].filter(Boolean).join(" · ");

  return (
    <div className="identity-profile">
      <section className="identity-profile-hero" aria-label="Mon profil">
        <div className="identity-profile-hero__avatar">
          <Avatar
            size="2xl"
            src={avatarUrl ?? undefined}
            alt={`Photo de ${displayName}`}
            fallback={displayName}
          />
        </div>

        <div className="identity-profile-hero__body">
          <p className="identity-profile-hero__eyebrow">Mon profil</p>
          <h2 className="identity-profile-hero__name">{displayName}</h2>

          {location ? (
            <p className="identity-profile-hero__location">{location}</p>
          ) : (
            <p className="identity-profile-hero__location identity-profile-hero__location--muted">
              Ajoutez votre ville pour vous présenter
            </p>
          )}

          {profile.bio ? (
            <p className="identity-profile-hero__bio">{profile.bio}</p>
          ) : (
            <p className="identity-profile-hero__bio identity-profile-hero__bio--muted">
              Racontez votre histoire musicale en quelques mots.
            </p>
          )}

          <div className="identity-profile-hero__meta">
            {genreLabel ? (
              <span className="identity-profile-chip">{genreLabel}</span>
            ) : null}
            {languageLabel ? (
              <span className="identity-profile-chip identity-profile-chip--muted">
                {languageLabel}
              </span>
            ) : null}
            <span className="identity-profile-chip identity-profile-chip--muted">
              Inscrit le {formatDate(profile.created_at)}
            </span>
          </div>

          <div className="identity-profile-completion" role="group" aria-label="Complétion du profil">
            <div className="identity-profile-completion__row">
              <span className="identity-profile-completion__label">Profil complété</span>
              <span className="identity-profile-completion__value">{completion}%</span>
            </div>
            <div
              className="identity-profile-completion__track"
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Profil complété à ${completion} pour cent`}
            >
              <div
                className="identity-profile-completion__fill"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          <div className="identity-profile-badges">
            <Badge variant="default">{accountLabel}</Badge>
            {isArtist ? (
              <Badge variant="outline">Vérification à venir</Badge>
            ) : null}
            <Badge variant="outline">{humanizeVisibility(preferences.profile_visibility)}</Badge>
          </div>

          <div className="identity-profile-actions">
            <Link
              href="/profile/edit"
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              Modifier mon profil
            </Link>
            <Link
              href="/settings/account"
              className={buttonVariants({ variant: "outline", size: "md" })}
            >
              Mon compte
            </Link>
            <Link
              href="/settings"
              className={buttonVariants({ variant: "ghost", size: "md" })}
            >
              Paramètres
            </Link>
            {isArtist ? (
              <Link
                href="/creator"
                className={buttonVariants({ variant: "outline", size: "md" })}
              >
                Mon espace artiste
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <ProfileActivitySection activity={activity} isArtist={isArtist} />

      {profile.account_type === "auditeur" ? (
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
