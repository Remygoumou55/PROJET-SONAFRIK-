import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { Card } from "./Card";

export interface AlbumCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  artist: string;
  coverUrl?: string;
  year?: number;
  trackCount?: number;
  isPremiumExclusive?: boolean;
  onPlay?: () => void;
}

export function AlbumCard({
  className,
  title,
  artist,
  coverUrl,
  year,
  trackCount,
  isPremiumExclusive,
  onPlay,
  ...props
}: AlbumCardProps) {
  return (
    <Card
      variant="interactive"
      padding="none"
      className={cn("group overflow-hidden", className)}
      {...props}
    >
      <div className="relative aspect-square w-full bg-elevated">
        {coverUrl ? (
          <img src={coverUrl} alt={`Couverture de ${title}`} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface to-elevated">
            <AlbumIcon />
          </div>
        )}
        {isPremiumExclusive ? (
          <span className="absolute left-2 top-2 rounded-md bg-or-solaire px-2 py-0.5 text-xs font-bold text-noir-profond">
            Premium
          </span>
        ) : null}
        {onPlay ? (
          <button
            type="button"
            onClick={onPlay}
            className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-vert-energie text-noir-profond opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vert-energie"
            aria-label={`Lire l'album ${title}`}
          >
            <PlayIcon />
          </button>
        ) : null}
      </div>
      <div className="p-3 md:p-4">
        <h4 className="truncate font-semibold text-texte-principal">{title}</h4>
        <p className="truncate text-sm text-texte-secondaire">{artist}</p>
        {(year ?? trackCount) ? (
          <p className="mt-1 text-xs text-texte-desactive">
            {[year, trackCount ? `${trackCount} titres` : null].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function AlbumIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-texte-desactive">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
