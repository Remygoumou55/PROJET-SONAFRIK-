import type { CreatorAnalyticsData } from "@sonafrik/types";
import { StreamStatsGrid } from "./StreamStatsGrid";
import { StreamTimeline } from "./StreamTimeline";
import { TopTracksTable } from "./TopTracksTable";
import { TopAlbumsTable } from "./TopAlbumsTable";
import { AudienceCard } from "./AudienceCard";
import { RevenueCard } from "./RevenueCard";
import { RoyaltyHistoryCard } from "./RoyaltyHistoryCard";

export function CreatorAnalyticsDashboard({ data }: { data: CreatorAnalyticsData }) {
  return (
    <div className="space-y-8">
      {/* Streams */}
      <StreamStatsGrid stats={data.streamStats} />

      {/* Timeline */}
      <StreamTimeline entries={data.timeline} />

      {/* Top Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopTracksTable tracks={data.topTracks} />
        <TopAlbumsTable albums={data.topAlbums} />
      </div>

      {/* Audience + Revenue */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AudienceCard stats={data.audienceStats} />
        <RevenueCard stats={data.revenueStats} />
      </div>

      {/* Royalty Engine — historique des cycles */}
      <RoyaltyHistoryCard history={data.royaltyHistory} />

      {/* Geo note */}
      <div className="border-bordure rounded-lg border border-dashed p-4">
        <p className="text-texte-desactive text-sm">
          <span className="text-texte-secondaire font-medium">Géographie · </span>
          Données non disponibles — les sessions de streaming ne collectent pas encore
          de données géographiques (pays, ville, région). Cette fonctionnalité sera
          implémentée lors de la mise en place de la collecte IP/profil.
        </p>
      </div>
    </div>
  );
}
