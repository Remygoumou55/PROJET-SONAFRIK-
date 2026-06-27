import Link from "next/link";
import { Avatar, Badge, buttonVariants } from "@sonafrik/ui";
import type { IdentityContext } from "@sonafrik/types";
import { formatDate } from "@/lib/formatters";
import { ProfileHeroGreeting } from "./ProfileHeroGreeting";
import {
  computeProfileCompletion,
  getAccountTypeLabel,
  getCountryLabel,
  getDisplayName,
  getGreetingFirstName,
  getProfileRemainingSteps,
  getSongLanguageLabel,
  humanizeVisibility,
  isArtistAccount,
} from "../lib/profilePresentation";

interface ProfileHeroPassportProps {
  context: IdentityContext;
  avatarUrl?: string | null;
}

export function ProfileHeroPassport({ context, avatarUrl }: ProfileHeroPassportProps) {
  const { profile, preferences } = context;
  const displayName = getDisplayName(profile);
  const firstName = getGreetingFirstName(profile, displayName);
  const isArtist = isArtistAccount(profile.account_type);
  const accountLabel = getAccountTypeLabel(profile.account_type);
  const completion = computeProfileCompletion(profile);
  const remainingSteps = getProfileRemainingSteps(profile);
  const genreLabel = profile.main_genre?.trim() || null;
  const languageLabel = getSongLanguageLabel(profile.song_language);
  const countryLabel = getCountryLabel(profile.country_code);
  const cityLabel = profile.city?.trim() || null;
  const regionLabel = profile.origin_region?.trim() || null;

  const journeyHint =
    remainingSteps > 0
      ? isArtist
        ? `Encore ${remainingSteps} étape${remainingSteps > 1 ? "s" : ""} avant votre premier morceau.`
        : `Encore ${remainingSteps} étape${remainingSteps > 1 ? "s" : ""} pour enrichir votre passeport musical.`
      : isArtist
        ? "Votre passeport est prêt — le studio vous attend."
        : "Votre passeport musical est complet.";

  return (
    <section
      className="identity-profile-hero identity-profile-passport"
      aria-label="Mon profil"
    >
      <ProfileHeroGreeting firstName={firstName} />

      <div className="identity-profile-passport__layout">
        <div className="identity-profile-passport__avatar-wrap">
          <Avatar
            size="2xl"
            src={avatarUrl ?? undefined}
            alt={`Photo de ${displayName}`}
            fallback={displayName}
            className="identity-profile-passport__avatar"
            imgProps={{ loading: "eager" }}
          />
        </div>

        <div className="identity-profile-passport__body">
          <h2 className="identity-profile-passport__name">{displayName}</h2>

          {profile.bio ? (
            <p className="identity-profile-passport__bio">{profile.bio}</p>
          ) : null}

          <ul className="identity-profile-passport__facts" aria-label="Informations du profil">
            {cityLabel ? (
              <li className="identity-profile-passport__fact">
                <span className="identity-profile-passport__fact-label">Ville</span>
                <span>{cityLabel}</span>
              </li>
            ) : null}
            {countryLabel ? (
              <li className="identity-profile-passport__fact">
                <span className="identity-profile-passport__fact-label">Pays</span>
                <span>{countryLabel}</span>
              </li>
            ) : null}
            {regionLabel && regionLabel !== countryLabel ? (
              <li className="identity-profile-passport__fact">
                <span className="identity-profile-passport__fact-label">Région</span>
                <span>{regionLabel}</span>
              </li>
            ) : null}
            {genreLabel ? (
              <li className="identity-profile-passport__fact">
                <span className="identity-profile-passport__fact-label">Genre</span>
                <span>{genreLabel}</span>
              </li>
            ) : null}
            {languageLabel ? (
              <li className="identity-profile-passport__fact">
                <span className="identity-profile-passport__fact-label">Langues</span>
                <span>{languageLabel}</span>
              </li>
            ) : null}
            <li className="identity-profile-passport__fact">
              <span className="identity-profile-passport__fact-label">Membre depuis</span>
              <span>{formatDate(profile.created_at)}</span>
            </li>
          </ul>

          <div className="identity-profile-passport__badges">
            <Badge variant="default">{accountLabel}</Badge>
            {isArtist ? <Badge variant="outline">Vérification à venir</Badge> : null}
            <Badge variant="outline">{humanizeVisibility(preferences.profile_visibility)}</Badge>
          </div>

          <div
            className="identity-profile-passport__journey"
            role="group"
            aria-label="Votre parcours SONAFRIK"
          >
            <p className="identity-profile-passport__journey-title">Votre parcours SONAFRIK</p>
            <p className="identity-profile-passport__journey-percent">
              Profil complété à {completion}&nbsp;%
            </p>
            <p className="identity-profile-passport__journey-hint">{journeyHint}</p>
            <div
              className="identity-profile-passport__progress-track"
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Profil complété à ${completion} pour cent`}
            >
              <div
                className="identity-profile-passport__progress-fill"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          <div className="identity-profile-passport__actions">
            <Link
              href="/profile/edit"
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              Modifier mon profil
            </Link>
            <div className="identity-profile-passport__actions-secondary">
              <Link
                href="/settings/account"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Mon compte
              </Link>
              {isArtist ? (
                <Link
                  href="/creator"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Mon espace artiste
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
