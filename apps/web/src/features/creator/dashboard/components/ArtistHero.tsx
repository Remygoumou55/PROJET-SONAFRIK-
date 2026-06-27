"use client";

import type { CSSProperties } from "react";
import type {
  ArtistProfile,
  Creator,
  CreatorDashboardHero,
  CreatorDashboardKpi,
} from "@sonafrik/types";
import { ArtistCoverSlider } from "./ArtistCoverSlider";
import { ArtistProfilePhoto } from "./ArtistProfilePhoto";
import { ArtistHeroStats } from "./ArtistHeroStats";
import { StatusBadge } from "./StatusBadge";
import { buildArtistHeroBadges, formatMemberSince, accountStatusLabel } from "../lib/artistHeroBadges";

interface ArtistHeroProps {
  hero: CreatorDashboardHero;
  artistProfile: ArtistProfile;
  creator: Creator;
  profileCreatedAt: string;
  kpis: CreatorDashboardKpi[];
}

export function ArtistHero({
  hero,
  artistProfile,
  creator,
  profileCreatedAt,
  kpis,
}: ArtistHeroProps) {
  const photoPath = artistProfile.profile_photo ?? artistProfile.cover_path;
  const coverImages =
    artistProfile.cover_images.length > 0
      ? artistProfile.cover_images
      : artistProfile.banner_path
        ? [artistProfile.banner_path]
        : [];

  const badges = buildArtistHeroBadges({
    creator,
    artistProfile,
    profilePercent: hero.profilePercent,
    profileCreatedAt,
  });

  return (
    <section className="artist-hero" aria-label="Vitrine artiste">
      <div className="artist-hero__banner">
        <ArtistCoverSlider
          creatorId={creator.id}
          stageName={artistProfile.stage_name}
          coverImages={coverImages}
        />
      </div>

      <div className="artist-hero__profile-below">
        <div className="artist-hero__profile-main">
          <div className="artist-hero__avatar-wrap">
            <ArtistProfilePhoto
              creatorId={creator.id}
              stageName={artistProfile.stage_name}
              photoPath={photoPath}
            />
          </div>

          <div className="artist-hero__identity-block">
            <div className="artist-hero__identity">
              <p className="artist-hero__greeting">{hero.greeting}</p>
              <h1 className="artist-hero__name">{artistProfile.stage_name}</h1>
              <StatusBadge />
              <p className="artist-hero__status">{accountStatusLabel(creator.status)}</p>
              <ul className="artist-hero__badges" aria-label="Informations du profil">
                {badges.map((badge) => (
                  <li key={badge.id} className={`artist-hero__badge artist-hero__badge--${badge.tone}`}>
                    {badge.label}
                  </li>
                ))}
              </ul>
            </div>

            <p className="artist-hero__headline">{hero.headline}</p>
            <p className="artist-hero__subline">{hero.subline}</p>

            <div className="artist-hero__progress-block">
              <div className="artist-hero__progress-header">
                <span>Progression du profil</span>
                <strong>{hero.profilePercent} %</strong>
              </div>
              <div
                className="artist-hero__progress-track"
                role="progressbar"
                aria-valuenow={hero.profilePercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="artist-hero__progress-fill artist-hero__progress-fill--animated"
                  style={{ "--progress": `${hero.profilePercent}%` } as CSSProperties}
                />
              </div>
              <p className="artist-hero__goal">
                <span className="artist-hero__goal-label">Objectif :</span> {hero.currentGoal}
              </p>
              <p className="artist-hero__next">{hero.nextStep}</p>
              <p className="artist-hero__member-since">Membre depuis {formatMemberSince(profileCreatedAt)}</p>
            </div>
          </div>
        </div>

        <ArtistHeroStats kpis={kpis} />
      </div>
    </section>
  );
}
