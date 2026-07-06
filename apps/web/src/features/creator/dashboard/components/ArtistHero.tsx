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

// ─── Props ────────────────────────────────────────────────────────────────────

export interface HeroStats {
  streams: number;
  validStreams: number;
  tracksPublished: number;
  estimatedMonthlyGnf: number;
}

interface ArtistHeroProps {
  hero: CreatorDashboardHero;
  artistProfile: ArtistProfile;
  creator: Creator;
  profileCreatedAt: string;
  stats: HeroStats;
  greeting: string;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function fmtGnf(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M GNF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k GNF`;
  return `${n} GNF`;
}

function fmtMemberSince(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ArtistHero = memo(function ArtistHero({
  artistProfile,
  creator,
  profileCreatedAt,
  hero,
  stats,
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

  const heroStats = [
    { icon: "🎵", value: fmtNum(stats.streams), label: "Streams" },
    { icon: "👂", value: fmtNum(stats.validStreams), label: "Écoutes" },
    { icon: "📀", value: String(stats.tracksPublished), label: "Morceaux" },
    { icon: "💰", value: fmtGnf(stats.estimatedMonthlyGnf), label: "Revenus / mois" },
  ];

  return (
    <section className="ahero" aria-label="Vitrine artiste">
      {/* Cover — fills 100% of the card */}
      <ArtistCoverSlider
        creatorId={creator.id}
        stageName={artistProfile.stage_name}
        primaryCoverPath={primaryCoverPath}
        originalPath={artistProfile.cover_primary_original}
        cropX={artistProfile.cover_primary_crop_x}
        cropY={artistProfile.cover_primary_crop_y}
        cropZoom={artistProfile.cover_primary_crop_zoom}
      />

      {/* Content overlaid on the cover */}
      <div className="ahero__content">

        {/* Top row: greeting (left) + action buttons (right) */}
        <div className="ahero__top">
          <p className="ahero__greeting">
            {greeting}
          </p>
        </div>

        {/* Bottom: avatar + identity + stats */}
        <div className="ahero__bottom">
          {/* Avatar */}
          <ArtistProfilePhoto
            creatorId={creator.id}
            stageName={artistProfile.stage_name}
            photoPath={photoPath}
            originalPath={artistProfile.avatar_original_path}
            cropX={artistProfile.avatar_crop_x}
            cropY={artistProfile.avatar_crop_y}
            cropZoom={artistProfile.avatar_crop_zoom}
          />

          {/* Identity */}
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
            <p className="ahero__type">{artistType}</p>
            {memberSince && (
              <p className="ahero__since">Membre depuis {memberSince}</p>
            )}

            {/* Stats row */}
            <div className="ahero__stats" role="list" aria-label="Statistiques">
              {heroStats.map((stat) => (
                <div key={stat.label} className="ahero__stat" role="listitem">
                  <span className="ahero__stat-icon" aria-hidden="true">{stat.icon}</span>
                  <span className="ahero__stat-value">{stat.value}</span>
                  <span className="ahero__stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
