"use client";

import Link from "next/link";
import { CoverImage } from "@/components/CoverImage";
import type { HeroItemAlbum } from "@sonafrik/types";
import type { HeroTheme } from "./heroEditorial";

interface Props {
  item: HeroItemAlbum;
  theme: HeroTheme;
  index: number;
  isActive: boolean;
}

function formatReleaseDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return null;
  }
}

export function HeroAlbumCard({ item, theme, index, isActive }: Props) {
  const artistHref = `/listen/artist/${item.creator_id}`;
  const albumHref = `/listen/album/${item.album_id}`;
  const releaseDate = formatReleaseDate(item.release_date);

  return (
    <article className="hcard hcard--album" aria-label={item.album_title}>
      {/* Background cover */}
      <div className="hcard__bg" aria-hidden="true">
        <CoverImage
          coverPath={item.cover_path}
          alt=""
          artistName={item.stage_name}
          gradientSeed={index + 100}
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

        {/* Album info */}
        <div className="hcard__info">
          {theme.badge && (
            <span className="hcard__badge">{theme.badge}</span>
          )}
          <h2 className="hcard__name">{item.album_title}</h2>
          <p className="hcard__meta">
            {item.stage_name}
            {item.genre_primary ? ` · ${item.genre_primary}` : ""}
          </p>
          {releaseDate && (
            <p className="hcard__bio">Sorti le {releaseDate}</p>
          )}
          {!releaseDate && item.bio_short && (
            <p className="hcard__bio">{item.bio_short}</p>
          )}
        </div>

        {/* CTAs */}
        <div className="hcard__actions">
          <Link
            href={albumHref}
            className="hcard__cta hcard__cta--primary"
            tabIndex={isActive ? 0 : -1}
            aria-label={`Écouter ${item.album_title}`}
          >
            <span aria-hidden="true">▶</span> Écouter l&apos;album
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
