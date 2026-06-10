import type { HTMLAttributes } from "react";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { cn } from "../lib/cn";

export type ArtistTierBadge = "standard" | "verifie" | "premium" | "legende" | "fondateur";

export interface ArtistCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  imageUrl?: string;
  genre?: string;
  listeners?: string;
  tier?: ArtistTierBadge;
  verified?: boolean;
  onPlay?: () => void;
}

const tierMap: Record<ArtistTierBadge, { label: string; variant: "default" | "verified" | "premium" | "legend" | "founder" }> = {
  standard: { label: "Standard", variant: "default" },
  verifie: { label: "Vérifié", variant: "verified" },
  premium: { label: "Premium", variant: "premium" },
  legende: { label: "Légende", variant: "legend" },
  fondateur: { label: "Fondateur", variant: "founder" },
};

export function ArtistCard({
  className,
  name,
  imageUrl,
  genre,
  listeners,
  tier = "standard",
  verified,
  onPlay,
  ...props
}: ArtistCardProps) {
  const tierInfo = tierMap[tier];

  return (
    <Card
      variant="interactive"
      padding="sm"
      className={cn("group flex flex-col items-center gap-3 text-center", className)}
      {...props}
    >
      <div className="relative">
        <Avatar src={imageUrl} alt={name} size="2xl" />
        {onPlay ? (
          <button
            type="button"
            onClick={onPlay}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-noir-profond/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-vert-energie"
            aria-label={`Écouter ${name}`}
          >
            <PlayIcon />
          </button>
        ) : null}
      </div>
      <div className="flex w-full flex-col items-center gap-1">
        <h4 className="truncate w-full font-semibold text-texte-principal">{name}</h4>
        {genre ? <p className="text-sm text-texte-secondaire">{genre}</p> : null}
        {listeners ? <p className="text-xs text-texte-desactive">{listeners} écoutes</p> : null}
        <div className="flex flex-wrap justify-center gap-1 pt-1">
          <Badge variant={tierInfo.variant} size="sm">
            {tierInfo.label}
          </Badge>
          {verified ? (
            <Badge variant="verified" size="sm">
              ✓
            </Badge>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function PlayIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-vert-energie">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
