"use client";

import Link from "next/link";
import { CoverImage } from "@/components/CoverImage";
import { getInitials } from "@/lib/utils";

interface ArtistChipProps {
  stageName: string;
  coverPath?: string | null;
  genre?: string;
  creatorId: string;
  gradientSeed?: number;
}

export function ArtistChip({
  stageName,
  coverPath,
  genre,
  creatorId,
  gradientSeed = 0,
}: ArtistChipProps) {
  return (
    <Link href={`/listen/artist/${creatorId}`} className="listen-artist-chip">
      <div className="listen-artist-chip-avatar">
        {coverPath ? (
          <CoverImage coverPath={coverPath} alt={stageName} gradientSeed={gradientSeed} imgSizes="64px" />
        ) : (
          <div className="listen-artist-chip-placeholder">{getInitials(stageName)}</div>
        )}
      </div>
      <p className="listen-artist-chip-name">{stageName}</p>
      {genre ? <p className="listen-artist-chip-genre">{genre}</p> : null}
    </Link>
  );
}
