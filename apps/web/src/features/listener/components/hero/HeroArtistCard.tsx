"use client";

import Link from "next/link";
import { CoverImage } from "@/components/CoverImage";
import type { HeroItemArtist } from "@sonafrik/types";
import type { HeroTheme } from "./heroEditorial";

interface Props {
  item: HeroItemArtist;
  theme: HeroTheme;
  index: number;
  isActive: boolean;
}

export function HeroArtistCard({ item, theme, index, isActive }: Props) {
  const artistHref = `/listen/artist/${item.creator_id}`;

  return (
    <article className="hcard hcard--artist" aria-label={item.stage_name}>
      {/* Background cover */}
      <div className="hcard__bg" aria-hidden="true">
        <CoverImage
          coverPath={item.cover_path}
          alt=""
          artistName={item.stage_name}
          gradientSeed={index}
          imgSizes="(max-width: 600px) 100vw, (max-width: 1100px) 85vw, 70vw"
          priority={isActive}
        />
      </div>
      <div className="hcard__overlay" aria-hidden="true" />

      {/* Content */}
      <div className="hcard__body">
        {/* Editorial theme */}
        <div className="hcard__editorial">
          <p className="hcard__theme-label">{theme.label}</p>
          <p className="hcard__theme-sub">{theme.subtitle}</p>
        </div>

        {/* Artist info */}
        <div className="hcard__info">
          {theme.badge && (
            <span className="hcard__badge">{theme.badge}</span>
          )}
          <h2 className="hcard__name">{item.stage_name}</h2>
          {item.genre_primary && (
            <p className="hcard__meta">{item.genre_primary}</p>
          )}
          {item.bio_short && (
            <p className="hcard__bio">{item.bio_short}</p>
          )}
        </div>

        {/* CTAs */}
        <div className="hcard__actions">
          <Link
            href={artistHref}
            className="hcard__cta hcard__cta--primary"
            tabIndex={isActive ? 0 : -1}
            aria-label={`Écouter ${item.stage_name}`}
          >
            <span aria-hidden="true">▶</span> Écouter
          </Link>
          <Link
            href={artistHref}
            className="hcard__cta hcard__cta--secondary"
            tabIndex={isActive ? 0 : -1}
            aria-label={`Voir le profil de ${item.stage_name}`}
          >
            <span aria-hidden="true">👤</span> Voir l&apos;artiste
          </Link>
        </div>
      </div>
    </article>
  );
}
