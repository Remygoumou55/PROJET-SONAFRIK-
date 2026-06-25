import type { ArtistProfile, CreatorDashboardHero } from "@sonafrik/types";
import type { CSSProperties } from "react";

interface HeroCardProps {
  hero: CreatorDashboardHero;
  artistProfile: ArtistProfile;
}

export function HeroCard({ hero, artistProfile }: HeroCardProps) {
  const initials = artistProfile.stage_name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <section className="creator-hero" aria-label="Accueil artiste">
      <div className="creator-hero__glow" aria-hidden="true" />
      <div className="creator-hero__inner">
        <div className="creator-hero__identity">
          <div className="creator-hero__avatar" aria-hidden="true">
            {initials || "🎤"}
          </div>
          <div className="creator-hero__meta">
            <p className="creator-hero__greeting">{hero.greeting}</p>
            <div className="creator-hero__badges">
              <span className="creator-hero__badge creator-hero__badge--tier">{hero.tierLabel}</span>
              <span className="creator-hero__badge">{hero.levelLabel}</span>
              {artistProfile.verified ? (
                <span className="creator-hero__badge creator-hero__badge--verified">✓ Vérifié</span>
              ) : null}
            </div>
          </div>
        </div>

        <h1 className="creator-hero__headline">{hero.headline}</h1>
        <p className="creator-hero__subline">{hero.subline}</p>
        <blockquote className="creator-hero__quote">&ldquo;{hero.quote}&rdquo;</blockquote>

        <div className="creator-hero__progress-block">
          <div className="creator-hero__progress-header">
            <span>Progression du profil</span>
            <strong>{hero.profilePercent} %</strong>
          </div>
          <div
            className="creator-hero__progress-track"
            role="progressbar"
            aria-valuenow={hero.profilePercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="creator-hero__progress-fill creator-hero__progress-fill--animated"
              style={{ "--progress": `${hero.profilePercent}%` } as CSSProperties}
            />
          </div>
          <p className="creator-hero__goal">
            <span className="creator-hero__goal-label">Objectif :</span> {hero.currentGoal}
          </p>
          <p className="creator-hero__next">{hero.nextStep}</p>
        </div>
      </div>
    </section>
  );
}
