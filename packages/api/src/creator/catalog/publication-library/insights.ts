import type { Track } from "@sonafrik/types";
import type { PublicationLibrarySort, PublicationTrackInsight } from "./types";
import { publicationSortToOrder } from "./query";

export function insightsRecordFromList(
  insights: PublicationTrackInsight[],
): Record<string, PublicationTrackInsight> {
  return Object.fromEntries(insights.map((row) => [row.track_id, row]));
}

/** Charge les métriques uniquement pour les statuts où elles ont du sens. */
export function shouldLoadPublicationInsight(status: string): boolean {
  return status === "published" || status === "pending_review";
}

/** Tri client streams/revenus — page courante uniquement. */
export function sortTracksWithInsights(
  tracks: Track[],
  sort: PublicationLibrarySort,
  insightsById: Record<string, PublicationTrackInsight>,
): Track[] {
  const order = publicationSortToOrder(sort);
  if (order.clientSide === "streams") {
    return [...tracks].sort(
      (a, b) => (insightsById[b.id]?.streams ?? 0) - (insightsById[a.id]?.streams ?? 0),
    );
  }
  if (order.clientSide === "revenue") {
    return [...tracks].sort(
      (a, b) => (insightsById[b.id]?.revenue_gnf ?? 0) - (insightsById[a.id]?.revenue_gnf ?? 0),
    );
  }
  return tracks;
}
