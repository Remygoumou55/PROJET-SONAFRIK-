import type { CreatorTopTrack } from "@sonafrik/types";
import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";

function fmtDuration(s: number | null): string {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function TopTracksTable({ tracks }: { tracks: CreatorTopTrack[] }) {
  if (tracks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Morceaux</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-texte-desactive text-sm">Aucun morceau publié.</p>
        </CardContent>
      </Card>
    );
  }

  const maxStreams = Math.max(...tracks.map((t) => t.valid_streams), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Morceaux</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-bordure divide-y">
          {tracks.map((track, i) => (
            <div key={track.track_id} className="hover:bg-elevated flex items-center gap-4 px-6 py-3 transition-colors">
              {/* Rank */}
              <span
                className={`w-5 shrink-0 text-center text-sm font-bold ${
                  i === 0
                    ? "text-or-solaire"
                    : i === 1
                      ? "text-texte-secondaire"
                      : i === 2
                        ? "text-or-profond"
                        : "text-texte-desactive"
                }`}
              >
                {i + 1}
              </span>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-texte-principal truncate text-sm font-medium">
                  {track.title}
                </p>
                <p className="text-texte-desactive truncate text-xs">
                  {track.album_title ?? "Morceau seul"} · {fmtDuration(track.duration_seconds)}
                </p>
                {/* Stream bar */}
                <div className="bg-surface mt-1.5 h-1 w-full rounded-full">
                  <div
                    className="bg-vert-energie h-1 rounded-full"
                    style={{
                      width: `${Math.round((track.valid_streams / maxStreams) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="hidden shrink-0 gap-6 sm:flex">
                <div className="text-right">
                  <p className="text-texte-principal text-sm font-semibold">
                    {track.valid_streams.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-texte-desactive text-xs">écoutes</p>
                </div>
                <div className="text-right">
                  <p className="text-texte-principal text-sm font-semibold">
                    {track.like_count.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-texte-desactive text-xs">J&apos;aime</p>
                </div>
                <div className="text-right">
                  <p className="text-vert-energie text-sm font-semibold">
                    {track.engagement_score.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-texte-desactive text-xs">popularité</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
