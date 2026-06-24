import type { CreatorAudienceStats } from "@sonafrik/types";
import { Card, CardContent, CardHeader, CardTitle } from "@sonafrik/ui";

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-texte-secondaire text-sm">{label}</span>
      <span
        className={`text-sm font-semibold ${accent ? "text-vert-energie" : "text-texte-principal"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function AudienceCard({ stats }: { stats: CreatorAudienceStats }) {
  const fmt = (n: number) => n.toLocaleString("fr-FR");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audience</CardTitle>
      </CardHeader>
      <CardContent className="divide-bordure divide-y">
        <Row label="Abonnés totaux" value={fmt(stats.total_followers)} accent />
        <Row
          label="→ Artiste"
          value={fmt(stats.artist_followers)}
        />
        <Row
          label="→ Créateur"
          value={fmt(stats.creator_followers)}
        />
        <Row
          label="Nouveaux abonnés (7j)"
          value={`+${fmt(stats.new_followers_7d)}`}
        />
        <Row
          label="Nouveaux abonnés (30j)"
          value={`+${fmt(stats.new_followers_30d)}`}
        />
        <Row
          label="Abonnés playlists"
          value={fmt(stats.playlist_followers)}
        />
        <Row
          label="Likes morceaux"
          value={fmt(stats.total_track_likes)}
        />
        <Row
          label="Favoris albums"
          value={fmt(stats.total_album_favorites)}
        />
        <Row
          label="Score d'engagement"
          value={stats.engagement_score.toLocaleString("fr-FR")}
          accent
        />
      </CardContent>
    </Card>
  );
}
