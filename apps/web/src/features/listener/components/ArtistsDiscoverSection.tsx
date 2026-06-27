import type { DiscoveryArtist } from "@sonafrik/types";
import { ArtistChip } from "./ArtistChip";

interface CuratedArtist {
  creator_id: string;
  stage_name: string;
  genres: string[];
}

interface ArtistsDiscoverSectionProps {
  suggestedArtists: DiscoveryArtist[];
  curatedArtists: CuratedArtist[];
}

export function ArtistsDiscoverSection({
  suggestedArtists,
  curatedArtists,
}: ArtistsDiscoverSectionProps) {
  const artists: Array<{ creator_id: string; stage_name: string; genre?: string; cover_path?: string | null }> =
    suggestedArtists.length > 0
      ? suggestedArtists.map((artist) => ({
          creator_id: artist.creator_id,
          stage_name: artist.stage_name,
          genre: artist.genres[0],
          cover_path: artist.cover_path,
        }))
      : curatedArtists.map((artist) => ({
          creator_id: artist.creator_id,
          stage_name: artist.stage_name,
          genre: artist.genres[0],
          cover_path: null,
        }));

  if (artists.length === 0) return null;

  return (
    <section className="listen-page-section mt-8" aria-labelledby="listen-artists-title">
      <div className="listen-section-header">
        <h2 id="listen-artists-title" className="listen-section-title">
          Artistes à découvrir
        </h2>
      </div>
      <div className="listen-artists-scroll">
        {artists.map((artist, index) => (
          <ArtistChip
            key={artist.creator_id}
            creatorId={artist.creator_id}
            stageName={artist.stage_name}
            coverPath={artist.cover_path}
            genre={artist.genre}
            gradientSeed={index}
          />
        ))}
      </div>
    </section>
  );
}
