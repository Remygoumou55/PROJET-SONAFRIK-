"use client";

import { memo } from "react";
import type {
  ArtistProfile,
  Creator,
  CreatorDashboardHero,
} from "@sonafrik/types";
import { ArtistCoverSlider } from "./ArtistCoverSlider";
import { ArtistProfilePhoto } from "./ArtistProfilePhoto";
import {
  buildHeroVitrineBadges,
  resolveArtistTypeLabel,
} from "@sonafrik/api/creator/presentation";
import { formatCreatorGreeting } from "@/features/creator/lib/greeting";

interface ArtistHeroProps {
  hero: CreatorDashboardHero;
  artistProfile: ArtistProfile;
  creator: Creator;
  profileCreatedAt: string;
}

export const ArtistHero = memo(function ArtistHero({
  artistProfile,
  creator,
  profileCreatedAt,
  hero,
}: ArtistHeroProps) {
  const photoPath = artistProfile.profile_photo ?? artistProfile.cover_path;
  const coverImages =
    (artistProfile.cover_images?.length ?? 0) > 0
      ? artistProfile.cover_images
      : artistProfile.banner_path
        ? [artistProfile.banner_path]
        : [];

  const badges = buildHeroVitrineBadges({
    artistProfile,
    profilePercent: hero.profilePercent,
    profileCreatedAt,
  });

  const artistType = resolveArtistTypeLabel(creator);

  return (
    <section className="artist-hero artist-hero--vitrine" aria-label="Vitrine artiste">
      <div className="artist-hero__banner artist-hero__banner--vitrine">
        <ArtistCoverSlider
          creatorId={creator.id}
          stageName={artistProfile.stage_name}
          coverImages={coverImages}
          variant="compact"
        />
      </div>

      <div className="artist-hero__body artist-hero__body--vitrine">
        <div className="artist-hero__avatar-wrap artist-hero__avatar-wrap--vitrine">
          <ArtistProfilePhoto
            creatorId={creator.id}
            stageName={artistProfile.stage_name}
            photoPath={photoPath}
          />
        </div>

        <div className="artist-hero__identity-block artist-hero__identity-block--vitrine">
          <p className="artist-hero__greeting artist-hero__greeting--vitrine">
            {formatCreatorGreeting(artistProfile.stage_name)}
          </p>
          <h2 className="artist-hero__name artist-hero__name--vitrine">
            {artistProfile.stage_name}
            <span className="artist-hero__note" aria-hidden="true">
              🎵
            </span>
          </h2>
          <p className="artist-hero__type artist-hero__type--vitrine">{artistType}</p>
          <ul
            className="artist-hero__badges artist-hero__badges--vitrine"
            aria-label="Statut du profil"
          >
            {badges.map((badge) => (
              <li
                key={badge.id}
                className={`artist-hero__badge artist-hero__badge--${badge.tone}`}
              >
                {badge.tone === "online" ? (
                  <>
                    <span className="artist-hero__online-dot" aria-hidden="true" />
                    {badge.label}
                  </>
                ) : (
                  badge.label
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
});
