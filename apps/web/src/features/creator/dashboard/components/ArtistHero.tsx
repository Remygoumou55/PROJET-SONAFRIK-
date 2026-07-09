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

interface ArtistHeroProps {
  hero: CreatorDashboardHero;
  artistProfile: ArtistProfile;
  creator: Creator;
  profileCreatedAt: string;
  greeting: string;
}

function fmtMemberSince(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "";
  }
}

export const ArtistHero = memo(function ArtistHero({
  artistProfile,
  creator,
  profileCreatedAt,
  hero,
  greeting,
}: ArtistHeroProps) {
  const photoPath = artistProfile.profile_photo ?? artistProfile.cover_path;
  const primaryCoverPath =
    (artistProfile.cover_images?.length ?? 0) > 0
      ? (artistProfile.cover_images?.[0] ?? null)
      : (artistProfile.banner_path ?? null);

  const allBadges = buildHeroVitrineBadges({
    artistProfile,
    profilePercent: hero.profilePercent,
    profileCreatedAt,
  });
  const visibleBadges = allBadges.filter((b) => b.id === "verified");
  const artistType = resolveArtistTypeLabel(creator);
  const memberSince = fmtMemberSince(profileCreatedAt);

  return (
    <section className="ahero" aria-label="Vitrine artiste">
      <ArtistCoverSlider
        creatorId={creator.id}
        stageName={artistProfile.stage_name}
        primaryCoverPath={primaryCoverPath}
      />

      <div className="ahero__content">
        <div className="ahero__top">
          <p className="ahero__greeting">{greeting}</p>
        </div>

        <div className="ahero__bottom">
          <ArtistProfilePhoto
            creatorId={creator.id}
            stageName={artistProfile.stage_name}
            photoPath={photoPath}
          />

          <div className="ahero__identity">
            <div className="ahero__name-row">
              <h2 className="ahero__name">{artistProfile.stage_name}</h2>
              {visibleBadges.length > 0 && (
                <ul className="ahero__badges" aria-label="Statut">
                  {visibleBadges.map((badge) => (
                    <li
                      key={badge.id}
                      className={`ahero__badge ahero__badge--${badge.tone}`}
                    >
                      {badge.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="ahero__presentation" role="list" aria-label="Présentation">
              <span className="ahero__chip ahero__chip--gold" role="listitem">
                {artistType}
              </span>
              {memberSince ? (
                <span className="ahero__chip" role="listitem">
                  Depuis {memberSince}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
