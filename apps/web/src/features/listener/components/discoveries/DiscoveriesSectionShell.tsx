import type { DiscoveryTrack } from "@sonafrik/types";
import { getTrackAgeDays } from "./discoveries.utils";
import { TrackCardStatic } from "./TrackCardStatic";

interface DiscoveriesSectionShellProps {
  tracks: DiscoveryTrack[];
  nowIso: string;
}

/** Grille statique Découvertes — Server Island (LCP). */
export function DiscoveriesSectionShell({ tracks, nowIso }: DiscoveriesSectionShellProps) {
  if (tracks.length === 0) return null;

  const now = new Date(nowIso);

  return (
    <div className="discoveries-scroll listen-tracks-scroll discoveries-shell-grid" role="list">
      {tracks.map((track, index) => (
        <div key={track.track_id} className="discovery-card-wrap">
          <TrackCardStatic
            trackId={track.track_id}
            title={track.title}
            artistName={track.artist_name}
            coverPath={track.cover_path}
            durationSeconds={track.duration_seconds}
            gradientSeed={index}
            isNew={getTrackAgeDays(track, now) <= 7}
            priority={index === 0}
            trackIndex={index}
          />
        </div>
      ))}
    </div>
  );
}
