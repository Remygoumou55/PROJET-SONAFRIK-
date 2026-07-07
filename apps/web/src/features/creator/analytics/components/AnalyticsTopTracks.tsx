"use client";

import { CoverImage } from "@/components/CoverImage";
import type { CreatorTopTrack } from "@sonafrik/types";
import { trackEvolutionBadge } from "../lib/analyticsPeriod";

interface Props {
  tracks: CreatorTopTrack[];
  maxItems?: number;
}

function TrendIcon({ direction }: { direction: "up" | "down" | "flat" }) {
  const cls =
    direction === "up"
      ? "analytics-rank__trend analytics-rank__trend--up"
      : direction === "down"
        ? "analytics-rank__trend analytics-rank__trend--down"
        : "analytics-rank__trend";
  const glyph = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  return <span className={cls} aria-hidden="true">{glyph}</span>;
}

export function AnalyticsTopTracks({ tracks, maxItems = 5 }: Props) {
  const visible = tracks.slice(0, maxItems);

  if (visible.length === 0) {
    return (
      <section className="analytics-rank" aria-label="Top morceaux">
        <h2 className="analytics-rank__title">Top morceaux</h2>
        <p className="analytics-rank__empty">Aucun morceau publié pour l&apos;instant.</p>
      </section>
    );
  }

  const leader = visible[0]!.valid_streams;

  return (
    <section className="analytics-rank" aria-label="Top morceaux">
      <h2 className="analytics-rank__title">Top morceaux</h2>
      <ol className="analytics-rank__list">
        {visible.map((track, i) => {
          const evo = trackEvolutionBadge(track.valid_streams, track.total_streams, leader);
          return (
            <li key={track.track_id} className="analytics-rank__item">
              <span
                className={`analytics-rank__pos${i < 3 ? ` analytics-rank__pos--${i + 1}` : ""}`}
                aria-label={`Rang ${i + 1}`}
              >
                {i + 1}
              </span>
              <div className="analytics-rank__cover">
                <CoverImage
                  coverPath={track.cover_path}
                  alt={track.title}
                  artistName={track.album_title ?? track.title}
                  gradientSeed={i}
                  size="sm"
                  imgSizes="40px"
                />
              </div>
              <div className="analytics-rank__meta">
                <p className="analytics-rank__name">{track.title}</p>
                <p className="analytics-rank__stat">
                  {track.valid_streams.toLocaleString("fr-FR")} écoutes
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
