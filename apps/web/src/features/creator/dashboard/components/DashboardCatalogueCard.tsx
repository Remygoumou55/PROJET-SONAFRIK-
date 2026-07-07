import Link from "next/link";
import type { CreatorTopTrack } from "@sonafrik/types";
import { CreatorAssetImage } from "./CreatorAssetImage";

interface Props {
  topTrack: CreatorTopTrack | null;
  tracksPublished: number;
  creatorId: string;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("fr-FR");
}

export function DashboardCatalogueCard({ topTrack, tracksPublished, creatorId }: Props) {
  return (
    <section className="dash-catalogue-card" aria-label="Mon catalogue">
      <div className="dash-catalogue-card__header">
        <h2 className="dash-section-title" style={{ margin: 0 }}>Mon catalogue</h2>
        <Link href="/creator/catalog" className="dash-catalogue-card__link">
          Voir tout →
        </Link>
      </div>
      {tracksPublished === 0 || !topTrack ? (
        <div className="dash-catalogue-card__empty">
          <span className="dash-catalogue-card__empty-icon" aria-hidden="true">🎵</span>
          <p className="dash-catalogue-card__empty-text">
            Aucun morceau publié pour le moment.
          </p>
        </div>
      ) : (
        <div className="dash-catalogue-card__track">
          <div className="dash-catalogue-card__cover">
            {topTrack.cover_path ? (
              <CreatorAssetImage
                creatorId={creatorId}
                path={topTrack.cover_path}
                assetKind="cover"
                alt={topTrack.title}
                layout="bounded"
                className="dash-catalogue-card__cover-img"
              />
            ) : (
              <span className="dash-catalogue-card__cover-fallback" aria-hidden="true">🎵</span>
            )}
          </div>
          <div className="dash-catalogue-card__meta">
            <p className="dash-catalogue-card__track-title">{topTrack.title}</p>
            <p className="dash-catalogue-card__track-streams">
              {fmtNum(topTrack.valid_streams)} écoute{topTrack.valid_streams !== 1 ? "s" : ""} valide{topTrack.valid_streams !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="dash-catalogue-card__badge">
            {tracksPublished} titre{tracksPublished !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </section>
  );
}
