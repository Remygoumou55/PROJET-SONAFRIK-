import Link from "next/link";
import type { CreatorInspirationArtist } from "@sonafrik/types";

interface InspirationSectionProps {
  artists: CreatorInspirationArtist[];
}

export function InspirationSection({ artists }: InspirationSectionProps) {
  if (artists.length === 0) return null;

  return (
    <section className="creator-widget creator-inspiration" aria-label="Inspiration">
      <h2 className="creator-widget__title">Cette semaine sur SONAFRIK 🔥</h2>
      <p className="creator-inspiration__subtitle">
        Ces artistes ont commencé comme vous — ils cartonnent maintenant
      </p>

      <div className="creator-inspiration__grid">
        {artists.map((artist) => (
          <article key={artist.creatorId} className="creator-inspiration__card">
            <div className="creator-inspiration__avatar" aria-hidden="true">
              {artist.stageName.slice(0, 1).toUpperCase()}
            </div>
            <div className="creator-inspiration__body">
              <p className="creator-inspiration__name">{artist.stageName}</p>
              <p className="creator-inspiration__genre">{artist.genreLabel}</p>
              <p className="creator-inspiration__streams">
                {artist.weeklyStreams.toLocaleString("fr-FR")} écoutes cette semaine
              </p>
            </div>
          </article>
        ))}
      </div>

      <p className="creator-inspiration__footer">Votre premier morceau peut apparaître ici.</p>
      <Link href="/creator/catalog/tracks" className="creator-inspiration__cta">
        Publier maintenant
      </Link>
    </section>
  );
}
