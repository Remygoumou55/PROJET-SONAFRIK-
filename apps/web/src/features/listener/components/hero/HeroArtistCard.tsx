"use client";

import Link from "next/link";
import { CoverImage } from "@/components/CoverImage";
import type { HeroItemArtist } from "@sonafrik/types";
import type { HeroTheme } from "./heroEditorial";
import { formatListenCount } from "./heroEditorial";

interface Props {
  item: HeroItemArtist;
  theme: HeroTheme;
  index: number;
  isActive: boolean;
}

export function HeroArtistCard({ item, theme, index, isActive }: Props) {
  const artistHref = `/listen/artist/${item.creator_id}`;

  const metaParts: string[] = [];
  if (item.genre_primary) metaParts.push(item.genre_primary);
  if (item.listen_count > 50) metaParts.push(`${formatListenCount(item.listen_count)} écoutes`);

  return (
    <article className={`hcard hcard--artist${isActive ? " hcard--active" : ""}`} aria-label={item.stage_name}>
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
            <span className={`hcard__badge hcard__badge--${theme.badgeVariant}`}>{theme.badge}</span>
          )}
          <h2 className="hcard__name">{item.stage_name}</h2>
          {metaParts.length > 0 && (
            <p className="hcard__meta">{metaParts.join(" · ")}</p>
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
            <svg className="hcard__play-icon" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true" width="10" height="12">
              <path d="M0 0L10 6L0 12Z" />
            </svg>
            Écouter
          </Link>
          <Link
            href={artistHref}
            className="hcard__cta hcard__cta--secondary"
            tabIndex={isActive ? 0 : -1}
            aria-label={`Voir le profil de ${item.stage_name}`}
          >
            Voir l&apos;artiste
          </Link>
        </div>
      </div>
    </article>
  );
}
