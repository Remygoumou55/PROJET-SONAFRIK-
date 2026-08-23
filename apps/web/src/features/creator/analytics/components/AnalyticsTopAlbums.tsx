
import { CoverImage } from "@/components/CoverImage";
import type { CreatorTopAlbum } from "@sonafrik/types";
import { trackEvolutionBadge } from "../lib/analyticsPeriod";

interface Props {
  albums: CreatorTopAlbum[];
  maxItems?: number;
}

function TrendIcon({ direction }: { direction: "up" | "down" | "flat" }) {
  const cls =
    direction === "up"
      ? "analytics-rank__trend analytics-rank__trend--up"
      : direction === "down"
        ? "analytics-rank__trend analytics-rank__trend--down"
        : "analytics-rank__trend";
  const glyph = direction === "up" ? "â†‘" : direction === "down" ? "â†“" : "â†’";
  return <span className={cls} aria-hidden="true">{glyph}</span>;
}

export function AnalyticsTopAlbums({ albums, maxItems = 5 }: Props) {
  const visible = albums.slice(0, maxItems);

  if (visible.length === 0) {
    return (
      <section className="analytics-rank" aria-label="Top albums">
        <h2 className="analytics-rank__title">Top albums</h2>
        <p className="analytics-rank__empty">Aucun album publiÃ© pour l&apos;instant.</p>
      </section>
    );
  }

  const leader = visible[0]!.valid_streams;

  return (
    <section className="analytics-rank" aria-label="Top albums">
      <h2 className="analytics-rank__title">Top albums</h2>
      <ol className="analytics-rank__list">
        {visible.map((album, i) => {
          const evo = trackEvolutionBadge(album.valid_streams, album.total_streams, leader);
          return (
            <li key={album.album_id} className="analytics-rank__item">
              <span
                className={`analytics-rank__pos${i < 3 ? ` analytics-rank__pos--${i + 1}` : ""}`}
                aria-label={`Rang ${i + 1}`}
              >
                {i + 1}
              </span>
              <div className="analytics-rank__cover">
                <CoverImage
                  coverPath={album.cover_path}
                  alt={album.title}
                  artistName={album.title}
                  gradientSeed={i}
                  size="sm"
                  imgSizes="40px"
                />
              </div>
              <div className="analytics-rank__meta">
                <p className="analytics-rank__name">{album.title}</p>
                <p className="analytics-rank__stat">
                  {album.valid_streams.toLocaleString("fr-FR")} Ã©coutes
                </p>
              </div>
              <div className="analytics-rank__evo" title={evo.label}>
                <TrendIcon direction={evo.direction} />
                <span className="analytics-rank__evo-label">{evo.label}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
