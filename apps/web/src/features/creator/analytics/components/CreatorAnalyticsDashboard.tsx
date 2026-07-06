import type { CreatorAnalyticsData } from "@sonafrik/types";
import { useCreatorAnalyticsSrtspLive } from "../hooks/useCreatorAnalyticsSrtspLive";
import { StreamStatsGrid } from "./StreamStatsGrid";
import { StreamTimeline } from "./StreamTimeline";
import { TopTracksTable } from "./TopTracksTable";
import { TopAlbumsTable } from "./TopAlbumsTable";
import { AudienceCard } from "./AudienceCard";
import { RevenueCard } from "./RevenueCard";
import { RoyaltyHistoryCard } from "./RoyaltyHistoryCard";

interface Props {
  data: CreatorAnalyticsData;
  creatorId: string;
}

export function CreatorAnalyticsDashboard({ data: initialData, creatorId }: Props) {
  const { data: liveData } = useCreatorAnalyticsSrtspLive({
    creatorId,
    initialData,
  });

  const data = liveData ?? initialData;

  return (
    <div className="space-y-8">
      <StreamStatsGrid stats={data.streamStats} />

      <StreamTimeline entries={data.timeline} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TopTracksTable tracks={data.topTracks} />
        <TopAlbumsTable albums={data.topAlbums} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AudienceCard stats={data.audienceStats} />
        <RevenueCard stats={data.revenueStats} />
      </div>

      <RoyaltyHistoryCard history={data.royaltyHistory} />

      <div className="border-bordure rounded-lg border border-dashed p-4">
        <p className="text-texte-desactive text-sm">
          <span className="text-texte-secondaire font-medium">Géographie · </span>
          Données non disponibles — nous ne collectons pas encore la localisation de vos
          auditeurs (pays, ville, région). Cette fonctionnalité arrivera prochainement.
        </p>
      </div>
    </div>
  );
}
