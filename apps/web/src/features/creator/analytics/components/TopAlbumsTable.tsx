import type { CreatorTopAlbum } from "@sonafrik/types";
import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";

const RELEASE_TYPE_LABELS: Record<string, string> = {
  album: "Album",
  single: "Single",
  ep: "EP",
};

export function TopAlbumsTable({ albums }: { albums: CreatorTopAlbum[] }) {
  if (albums.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Albums</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-texte-desactive text-sm">Aucun album publié.</p>
        </CardContent>
      </Card>
    );
  }

  const maxStreams = Math.max(...albums.map((a) => a.valid_streams), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Albums</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-bordure divide-y">
          {albums.map((album, i) => (
            <div key={album.album_id} className="hover:bg-elevated flex items-center gap-4 px-6 py-3 transition-colors">
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

              {/* Cover placeholder */}
              <div className="bg-surface border-bordure h-10 w-10 shrink-0 rounded border" />

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-texte-principal truncate text-sm font-medium">
                  {album.title}
                </p>
                <p className="text-texte-desactive text-xs">
                  {RELEASE_TYPE_LABELS[album.release_type] ?? album.release_type}
                  {" · "}
                  {album.track_count} morceau{album.track_count > 1 ? "x" : ""}
                  {album.release_date ? ` · ${album.release_date.slice(0, 4)}` : ""}
                </p>
                <div className="bg-surface mt-1.5 h-1 w-full rounded-full">
                  <div
                    className="bg-vert-energie h-1 rounded-full"
                    style={{
                      width: `${Math.round((album.valid_streams / maxStreams) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="hidden shrink-0 gap-6 sm:flex">
                <div className="text-right">
                  <p className="text-texte-principal text-sm font-semibold">
                    {album.valid_streams.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-texte-desactive text-xs">streams</p>
                </div>
                <div className="text-right">
                  <p className="text-texte-principal text-sm font-semibold">
                    {album.like_count.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-texte-desactive text-xs">likes</p>
                </div>
                <div className="text-right">
                  <p className="text-vert-energie text-sm font-semibold">
                    {album.engagement_score.toLocaleString("fr-FR")}
                  </p>
                  <p className="text-texte-desactive text-xs">score</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
