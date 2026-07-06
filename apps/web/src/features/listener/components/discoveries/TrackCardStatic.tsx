import { formatTrackDuration } from "../../lib/formatTrackDuration";
import { CoverImageStatic } from "./CoverImageStatic";

interface TrackCardStaticProps {
  trackId: string;
  title: string;
  artistName: string | null;
  coverPath?: string | null;
  durationSeconds: number | null;
  gradientSeed?: number;
  isNew?: boolean;
  priority?: boolean;
  trackIndex: number;
}

/** Carte morceau statique — rendu serveur, sans Player ni handlers. */
export function TrackCardStatic({
  trackId,
  title,
  artistName,
  coverPath,
  durationSeconds,
  gradientSeed = 0,
  isNew = false,
  priority = false,
  trackIndex,
}: TrackCardStaticProps) {
  return (
    <div
      className="listen-track-card listen-track-card--static"
      data-track-id={trackId}
      data-track-index={trackIndex}
      role="listitem"
    >
      <div className="listen-track-card-cover">
        {isNew ? <span className="discovery-new-badge">NEW</span> : null}
        <CoverImageStatic
          coverPath={coverPath}
          alt={title}
          artistName={artistName ?? title}
          gradientSeed={gradientSeed}
          imgSizes="160px"
          priority={priority}
        />
        <div className="listen-track-card-play-overlay discoveries-play-overlay" aria-hidden="true">
          <span className="listen-track-card-play-btn discoveries-play-btn">
            <svg width="14" height="16" viewBox="0 0 10 12" fill="currentColor">
              <path d="M0 0L10 6L0 12V0Z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="listen-track-card-info">
        <p className="listen-track-card-title">{title}</p>
        {artistName ? <p className="listen-track-card-artist">{artistName}</p> : null}
        <p className="listen-track-card-duration">{formatTrackDuration(durationSeconds)}</p>
      </div>
    </div>
  );
}
